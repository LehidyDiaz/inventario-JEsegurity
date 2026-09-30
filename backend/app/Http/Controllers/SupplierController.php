<?php
namespace App\Http\Controllers;
use App\Models\Supplier;
use Illuminate\Http\{JsonResponse, Request};
class SupplierController extends ApiController
{
    public function index(): array { return Supplier::with('products')->orderBy('name')->get()->map(fn($x)=>$this->supplier($x))->all(); }
    public function store(Request $r): JsonResponse { $d=$this->data($r); $ids=$d['productIds']??[]; unset($d['productIds']); $x=Supplier::create($this->map($d)); $x->products()->sync($ids); return response()->json($this->supplier($x->load('products')),201); }
    public function update(Request $r, Supplier $supplier): array { $d=$this->data($r); $ids=$d['productIds']??[]; unset($d['productIds']); $supplier->update($this->map($d)); $supplier->products()->sync($ids); return $this->supplier($supplier->load('products')); }
    public function destroy(Supplier $supplier): JsonResponse { if($supplier->movements()->exists()) return $this->conflict('El proveedor tiene movimientos asociados.'); $supplier->delete(); return response()->json(['message'=>'Proveedor eliminado.']); }
    private function data(Request $r): array { return $r->validate(['name'=>['required','string','max:160'],'category'=>['nullable','string','max:100'],'contact'=>['nullable','string','max:120'],'phone'=>['nullable','string','max:30'],'email'=>['nullable','email','max:160'],'rating'=>['nullable','numeric','between:0,5'],'status'=>['required','in:Activo,En revisión,Inactivo'],'productIds'=>['present','array'],'productIds.*'=>['integer','distinct','exists:products,id']]); }
    private function map(array $d): array { $d['contact_name']=$d['contact']??null; unset($d['contact']); return $d; }
}
