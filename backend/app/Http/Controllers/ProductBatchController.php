<?php

namespace App\Http\Controllers;

use App\Models\ProductBatch;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Validation\Rule;

class ProductBatchController extends ApiController
{
    public function index(Request $request): array
    {
        $query=ProductBatch::with('product')->orderByRaw('expiration_date IS NULL')->orderBy('expiration_date');
        if($request->filled('productId')) $query->where('product_id',$request->integer('productId'));
        if($request->query('filter')==='upcoming') $query->where('status','Activo')->where(function($q){$q->whereBetween('expiration_date',[now()->toDateString(),now()->addDays(30)->toDateString()])->orWhereBetween('next_inspection_at',[now()->toDateString(),now()->addDays(30)->toDateString()]);});
        if($request->query('filter')==='expired') $query->where(function($q){$q->where('status','Vencido')->orWhere('expiration_date','<',now()->toDateString());});
        return $query->get()->map(fn($x)=>$this->batch($x))->all();
    }
    public function store(Request $request): JsonResponse { $x=ProductBatch::create($this->data($request)); return response()->json($this->batch($x->load('product')),201); }
    public function show(ProductBatch $productBatch): array { return $this->batch($productBatch->load('product')); }
    public function update(Request $request, ProductBatch $productBatch): array { $productBatch->update($this->data($request,$productBatch)); return $this->batch($productBatch->load('product')); }
    public function destroy(ProductBatch $productBatch): JsonResponse { $productBatch->delete(); return response()->json(['message'=>'Lote eliminado.']); }
    public function summary(): array { return ['expired'=>ProductBatch::where(fn($q)=>$q->where('status','Vencido')->orWhere('expiration_date','<',now()->toDateString()))->count(),'upcoming'=>ProductBatch::where('status','Activo')->whereBetween('expiration_date',[now()->toDateString(),now()->addDays(30)->toDateString()])->count(),'inspectionsDue'=>ProductBatch::where('status','Activo')->where('next_inspection_at','<=',now()->addDays(30)->toDateString())->count()]; }
    private function data(Request $r,?ProductBatch $b=null): array { $d=$r->validate(['productId'=>'required|integer|exists:products,id','lotNumber'=>['required','string','max:100',Rule::unique('product_batches','lot_number')->where(fn($q)=>$q->where('product_id',$r->input('productId')))->ignore($b)],'serialNumber'=>['nullable','string','max:120',Rule::unique('product_batches','serial_number')->ignore($b)],'quantity'=>'required|numeric|min:0|max:9999999999.99','expirationDate'=>'nullable|date','nextInspectionAt'=>'nullable|date','status'=>'required|in:Activo,Vencido,Consumido','notes'=>'nullable|string']); return ['product_id'=>$d['productId'],'lot_number'=>$d['lotNumber'],'serial_number'=>$d['serialNumber']??null,'quantity'=>$d['quantity'],'expiration_date'=>$d['expirationDate']??null,'next_inspection_at'=>$d['nextInspectionAt']??null,'status'=>$d['status'],'notes'=>$d['notes']??null]; }
}
