<?php

namespace App\Http\Controllers;

use App\Models\{InventoryMovement, Product, PurchaseOrder};
use App\Services\{AuditService, FolioService};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends ApiController
{
    public function index(): array { return PurchaseOrder::with(['supplier','items.product'])->latest()->get()->map(fn($x)=>$this->purchase($x))->all(); }
    public function show(PurchaseOrder $purchaseOrder): array { return $this->purchase($purchaseOrder->load(['supplier','items.product'])); }
    public function store(Request $r,FolioService $folios): JsonResponse
    {
        $d=$this->data($r);
        $order=DB::transaction(function()use($d,$r,$folios){$items=$d['items']; unset($d['items']); $order=PurchaseOrder::create($this->attributes($d)+['folio'=>$folios->next('OC'),'created_by'=>$r->user()->id,'total'=>$this->total($items)]); $order->items()->createMany($this->items($items)); return $order;});
        return response()->json($this->purchase($order->load(['supplier','items.product'])),201);
    }
    public function update(Request $r,PurchaseOrder $purchaseOrder): array
    {
        if(in_array($purchaseOrder->status,['Recibida','Cancelada'],true)) throw ValidationException::withMessages(['status'=>['Una orden recibida o cancelada no puede editarse.']]);
        $d=$this->data($r);
        DB::transaction(function()use($d,$purchaseOrder){$items=$d['items']; unset($d['items']); if($purchaseOrder->items()->where('received_quantity','>',0)->exists()) throw ValidationException::withMessages(['items'=>['No se pueden reemplazar partidas que ya tienen recepción.']]); $purchaseOrder->update($this->attributes($d)+['total'=>$this->total($items)]); $purchaseOrder->items()->delete(); $purchaseOrder->items()->createMany($this->items($items));});
        return $this->purchase($purchaseOrder->load(['supplier','items.product']));
    }
    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse { if($purchaseOrder->status!=='Borrador') return $this->conflict('Solo se pueden eliminar órdenes en borrador.'); $purchaseOrder->delete(); return response()->json(['message'=>'Orden eliminada.']); }
    public function send(PurchaseOrder $purchaseOrder): array { if($purchaseOrder->status!=='Borrador') throw ValidationException::withMessages(['status'=>['Solo un borrador puede enviarse.']]); $purchaseOrder->update(['status'=>'Enviada']); return $this->purchase($purchaseOrder->load(['supplier','items.product'])); }
    public function approve(Request $r,PurchaseOrder $purchaseOrder): array { if(!in_array($purchaseOrder->status,['Borrador','Enviada'],true)) throw ValidationException::withMessages(['status'=>['La orden no puede aprobarse en su estado actual.']]); $purchaseOrder->update(['status'=>'Enviada','approved_by'=>$r->user()->id]); AuditService::record('approve',$purchaseOrder,description:"Orden {$purchaseOrder->folio} aprobada"); return $this->purchase($purchaseOrder->load(['supplier','items.product'])); }
    public function receive(Request $r,PurchaseOrder $purchaseOrder,FolioService $folios): array
    {
        $data=$r->validate(['items'=>'required|array|min:1','items.*.itemId'=>'required|integer|distinct','items.*.quantity'=>'required|numeric|gt:0']);
        DB::transaction(function()use($data,$purchaseOrder,$r,$folios){
            $order=PurchaseOrder::whereKey($purchaseOrder->id)->lockForUpdate()->firstOrFail();
            if(in_array($order->status,['Borrador','Recibida','Cancelada'],true)) throw ValidationException::withMessages(['status'=>['La orden no admite recepciones.']]);
            $order->load('items'); $requested=collect($data['items'])->keyBy('itemId');
            if($requested->keys()->diff($order->items->pluck('id'))->isNotEmpty()) throw ValidationException::withMessages(['items'=>['Una partida no pertenece a la orden.']]);
            $selected=$order->items->whereIn('id',$requested->keys()); $products=Product::whereIn('id',$selected->pluck('product_id'))->lockForUpdate()->get()->keyBy('id');
            $folio=$folios->next('MOV');
            $movement=InventoryMovement::create(['folio'=>$folio,'type'=>'in','reference'=>$order->folio,'origin'=>'Recepción de compra','status'=>'Confirmado','movement_date'=>now(),'supplier_id'=>$order->supplier_id,'created_by'=>$r->user()->id,'reviewed_by'=>$r->user()->id,'reviewed_at'=>now()]);
            foreach($selected as $item){$quantity=(float)$requested[$item->id]['quantity']; $pending=(float)$item->ordered_quantity-(float)$item->received_quantity; if($quantity>$pending) throw ValidationException::withMessages(['items'=>["La recepción excede el pendiente de {$item->product_id}."]]); $product=$products[$item->product_id]; $previous=(float)$product->quantity; $product->update(['quantity'=>$previous+$quantity]); $movement->items()->create(['product_id'=>$product->id,'quantity'=>$quantity,'previous_quantity'=>$previous]); $item->update(['received_quantity'=>(float)$item->received_quantity+$quantity]);}
            $allReceived=$order->items()->whereColumn('received_quantity','<','ordered_quantity')->doesntExist(); $order->update(['status'=>$allReceived?'Recibida':'Parcial']); AuditService::record('receive',$order,new:['movementId'=>$movement->id],description:"Recepción de {$order->folio}");
        });
        return $this->purchase($purchaseOrder->fresh()->load(['supplier','items.product']));
    }
    private function data(Request $r): array { return $r->validate(['supplierId'=>'required|integer|exists:suppliers,id','orderDate'=>'required|date','expectedDate'=>'nullable|date|after_or_equal:orderDate','status'=>'required|in:Borrador,Enviada,Cancelada','notes'=>'nullable|string','items'=>'required|array|min:1','items.*.productId'=>'required|integer|distinct|exists:products,id','items.*.orderedQuantity'=>'required|numeric|gt:0','items.*.unitPrice'=>'required|numeric|min:0']); }
    private function attributes(array $d): array { return ['supplier_id'=>$d['supplierId'],'order_date'=>$d['orderDate'],'expected_date'=>$d['expectedDate']??null,'status'=>$d['status'],'notes'=>$d['notes']??null]; }
    private function items(array $items): array { return array_map(fn($x)=>['product_id'=>$x['productId'],'ordered_quantity'=>$x['orderedQuantity'],'unit_price'=>$x['unitPrice']],$items); }
    private function total(array $items): float { return collect($items)->sum(fn($x)=>(float)$x['orderedQuantity']*(float)$x['unitPrice']); }
}
