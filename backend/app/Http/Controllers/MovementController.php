<?php
namespace App\Http\Controllers;
use App\Models\{InventoryMovement, Product};
use App\Services\{AuditService, FolioService, NotificationService};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class MovementController extends ApiController
{
    public function index(): array
    {
        return InventoryMovement::with(['items.product.category','creator'])->latest('movement_date')->get()->map(fn($x)=>$this->movement($x))->all();
    }

    public function store(Request $request, FolioService $folios): JsonResponse
    {
        $data=$this->data($request);
        if ($request->user()->role->name === 'Operador') $data['status']='Pendiente';
        $movement=DB::transaction(function () use ($data,$request,$folios) {
            $products=Product::whereIn('id',collect($data['items'])->pluck('productId'))->lockForUpdate()->get()->keyBy('id');
            $folio=$folios->next('MOV');
            $data['reference']=$data['reference'] ?: $folio;
            $movement=InventoryMovement::create($this->attributes($data)+['folio'=>$folio,'created_by'=>$request->user()->id,'reviewed_by'=>$data['status']==='Confirmado'?$request->user()->id:null,'reviewed_at'=>$data['status']==='Confirmado'?now():null]);
            $this->apply($movement,$data['items'],$products);
            return $movement;
        });
        return response()->json($this->movement($movement->load(['items.product.category','creator'])),201);
    }

    public function update(Request $request, InventoryMovement $movement): array
    {
        $data=$this->data($request);
        DB::transaction(function () use ($data,$request,$movement) {
            $movement->load('items');
            $ids=collect($data['items'])->pluck('productId')->merge($movement->items->pluck('product_id'))->unique();
            $products=Product::whereIn('id',$ids)->lockForUpdate()->get()->keyBy('id');
            $this->reverse($movement,$products);
            $movement->items()->delete();
            $movement->update($this->attributes($data)+['reviewed_by'=>$data['status']==='Confirmado'?$request->user()->id:null]);
            $this->apply($movement,$data['items'],$products);
        });
        return $this->movement($movement->load(['items.product.category','creator']));
    }

    public function destroy(InventoryMovement $movement): JsonResponse
    {
        DB::transaction(function () use ($movement) {
            $movement->load('items');
            $products=Product::whereIn('id',$movement->items->pluck('product_id'))->lockForUpdate()->get()->keyBy('id');
            $this->reverse($movement,$products);
            $movement->delete();
        });
        return response()->json(['message'=>'Movimiento eliminado y existencias revertidas.']);
    }

    public function approve(Request $request, InventoryMovement $movement, NotificationService $notifications): array
    {
        DB::transaction(function () use ($request,$movement,$notifications) {
            $locked=InventoryMovement::whereKey($movement->id)->lockForUpdate()->firstOrFail();
            if($locked->status!=='Pendiente') throw ValidationException::withMessages(['status'=>['Solo se pueden aprobar movimientos pendientes.']]);
            $locked->load('items');
            $products=Product::whereIn('id',$locked->items->pluck('product_id'))->lockForUpdate()->get()->keyBy('id');
            foreach($locked->items as $item){$product=$products[$item->product_id]; $current=(float)$product->quantity; $quantity=(float)$item->quantity; $new=match($locked->type){'in'=>$current+$quantity,'out'=>$current-$quantity,'adjustment'=>$quantity}; if($new<0) throw ValidationException::withMessages(['items'=>["Stock insuficiente para {$product->name}. Disponible: {$current}."]]); $product->update(['quantity'=>$new]); $item->update(['previous_quantity'=>$current]);}
            $locked->update(['status'=>'Confirmado','reviewed_by'=>$request->user()->id,'reviewed_at'=>now(),'rejection_reason'=>null]);
            AuditService::record('approve',$locked,description:"Movimiento {$locked->folio} aprobado");
            $notifications->create($locked->creator,'movements','Movimiento aprobado',$locked->folio,'low',"/movements/{$locked->id}",$locked->id.'-approved');
        });
        return $this->movement($movement->fresh()->load(['items.product.category','creator']));
    }

    public function reject(Request $request, InventoryMovement $movement, NotificationService $notifications): array
    {
        $data=$request->validate(['reason'=>'required|string|max:1000']);
        DB::transaction(function () use ($request,$movement,$notifications,$data) {
            $locked=InventoryMovement::whereKey($movement->id)->lockForUpdate()->firstOrFail();
            if($locked->status!=='Pendiente') throw ValidationException::withMessages(['status'=>['Solo se pueden rechazar movimientos pendientes.']]);
            $locked->update(['status'=>'Rechazado','reviewed_by'=>$request->user()->id,'reviewed_at'=>now(),'rejection_reason'=>$data['reason']]);
            AuditService::record('reject',$locked,new:['reason'=>$data['reason']],description:"Movimiento {$locked->folio} rechazado");
            $notifications->create($locked->creator,'movements','Movimiento rechazado',$locked->folio.': '.$data['reason'],'high',"/movements/{$locked->id}",$locked->id.'-rejected');
        });
        return $this->movement($movement->fresh()->load(['items.product.category','creator']));
    }

    private function data(Request $r): array
    {
        return $r->validate(['type'=>['required','in:in,out,adjustment'],'reference'=>['nullable','string','max:180'],'origin'=>['nullable','string','max:180'],'status'=>['required','in:Confirmado,Pendiente,Revisión'],'date'=>['required','date'],'supplierId'=>['nullable','integer','exists:suppliers,id'],'serviceId'=>['nullable','integer','exists:services,id'],'items'=>['required','array','min:1'],'items.*.productId'=>['required','integer','distinct','exists:products,id'],'items.*.quantity'=>['required','numeric','gt:0','max:9999999999.99']]);
    }

    private function attributes(array $d): array
    {
        return ['type'=>$d['type'],'reference'=>$d['reference'] ?? '','origin'=>$d['origin']??null,'status'=>$d['status'],'movement_date'=>$d['date'],'supplier_id'=>$d['supplierId']??null,'service_id'=>$d['serviceId']??null];
    }

    private function apply(InventoryMovement $movement,array $items,$products): void
    {
        foreach($items as $item){
            $product=$products[$item['productId']];
            $previous=null;
            if($movement->status==='Confirmado'){
                $current=(float)$product->quantity;
                $quantity=(float)$item['quantity'];
                $previous=$current;
                $new=match($movement->type){'in'=>$current+$quantity,'out'=>$current-$quantity,'adjustment'=>$quantity};
                if($new<0) throw ValidationException::withMessages(['items'=>["Stock insuficiente para {$product->name}. Disponible: {$current}."]]);
                $product->update(['quantity'=>$new]);
            }
            $movement->items()->create(['product_id'=>$product->id,'quantity'=>$item['quantity'],'previous_quantity'=>$previous]);
        }
    }

    private function reverse(InventoryMovement $movement,$products): void
    {
        if($movement->status!=='Confirmado') return;
        foreach($movement->items as $item){
            $product=$products[$item->product_id];
            $current=(float)$product->quantity;
            $new=match($movement->type){'in'=>$current-(float)$item->quantity,'out'=>$current+(float)$item->quantity,'adjustment'=>(float)$item->previous_quantity};
            if($new<0) throw ValidationException::withMessages(['items'=>["No se puede revertir el movimiento: el stock de {$product->name} ya fue consumido."]]);
            $product->update(['quantity'=>$new]);
        }
    }
}
