<?php
namespace App\Http\Controllers;
use App\Models\Product;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Validation\Rule;
class ProductController extends ApiController
{
    public function index(): array { return Product::with(['category', 'location'])->where('active', true)->orderBy('name')->get()->map(fn ($p) => $this->product($p))->all(); }
    public function store(Request $r): JsonResponse { $p = Product::create($this->validated($r)); return response()->json($this->product($p->load(['category', 'location'])), 201); }
    public function update(Request $r, Product $product): array { $product->update($this->validated($r, $product)); return $this->product($product->load(['category', 'location'])); }
    public function destroy(Product $product): JsonResponse { $product->update(['active' => false]); return response()->json(['message' => 'Producto desactivado.']); }
    private function validated(Request $r, ?Product $p = null): array
    {
        $d = $r->validate(['name' => ['required','string','max:160'], 'sku' => ['required','string','max:80',Rule::unique('products')->ignore($p)], 'categoryId' => ['required','integer','exists:categories,id'], 'unit' => ['required','string','max:40'], 'purchasePrice' => ['required','numeric','min:0','max:9999999999.99'], 'quantity' => [$p ? 'sometimes' : 'required','numeric','min:0','max:9999999999.99'], 'minimum' => ['required','numeric','min:0','max:9999999999.99'], 'locationId' => ['nullable','integer','exists:locations,id'], 'active' => ['sometimes','boolean']]);
        return ['name'=>$d['name'],'sku'=>$d['sku'],'category_id'=>$d['categoryId'],'unit'=>$d['unit'],'purchase_price'=>$d['purchasePrice'],'quantity'=>$d['quantity'] ?? $p->quantity,'minimum_quantity'=>$d['minimum'],'location_id'=>$d['locationId'] ?? null,'active'=>$d['active'] ?? ($p?->active ?? true)];
    }
}
