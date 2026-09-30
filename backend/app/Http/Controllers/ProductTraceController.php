<?php

namespace App\Http\Controllers;

use App\Models\Product;

class ProductTraceController extends ApiController
{
    public function trace(Product $product): array
    {
        $product->load(['category','location','batches','suppliers.products','movementItems.movement.creator','purchaseItems.order.supplier']);
        $movements=$product->movementItems->sortByDesc(fn($i)=>$i->movement?->movement_date)->map(fn($i)=>['id'=>$i->movement_id,'folio'=>$i->movement?->folio,'type'=>$i->movement?->type,'status'=>$i->movement?->status,'date'=>$i->movement?->movement_date?->toISOString(),'quantity'=>(float)$i->quantity,'user'=>$i->movement?->creator?->full_name])->values();
        $serviceIds=$product->movementItems->pluck('movement.service_id')->filter()->unique();
        $services=\App\Models\Service::with(['client','assignedUsers'])->whereIn('id',$serviceIds)->get()->map(fn($s)=>$this->service($s));
        return ['product'=>$this->product($product),'movements'=>$movements,'batches'=>$product->batches->map(fn($b)=>$this->batch($b)),'suppliers'=>$product->suppliers->map(fn($s)=>['id'=>$s->id,'name'=>$s->name]),'services'=>$services,'purchases'=>$product->purchaseItems->map(fn($i)=>['id'=>$i->order?->id,'folio'=>$i->order?->folio,'supplier'=>$i->order?->supplier?->name,'orderedQuantity'=>(float)$i->ordered_quantity,'receivedQuantity'=>(float)$i->received_quantity]),'totals'=>['currentStock'=>(float)$product->quantity,'batchQuantity'=>(float)$product->batches->where('status','Activo')->sum('quantity'),'movementCount'=>$movements->count(),'supplierCount'=>$product->suppliers->count()]];
    }

    public function label(Product $product): array { return ['id'=>$product->id,'sku'=>$product->sku,'name'=>$product->name,'url'=>url("/api/products/{$product->id}/trace")]; }
}
