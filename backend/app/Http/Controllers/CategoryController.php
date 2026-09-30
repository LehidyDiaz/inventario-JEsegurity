<?php
namespace App\Http\Controllers;
use App\Models\Category;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Validation\Rule;
class CategoryController extends ApiController
{
    public function index(): array { return Category::orderBy('name')->get()->map(fn($x)=>$this->category($x))->all(); }
    public function store(Request $r): JsonResponse { $x=Category::create($this->data($r)); return response()->json($this->category($x),201); }
    public function update(Request $r, Category $category): array { $category->update($this->data($r,$category)); return $this->category($category); }
    public function destroy(Category $category): JsonResponse { if($category->products()->exists()) return $this->conflict('La categoría tiene productos asociados.'); $category->delete(); return response()->json(['message'=>'Categoría eliminada.']); }
    private function data(Request $r, ?Category $x=null): array { return $r->validate(['name'=>['required','string','max:80',Rule::unique('categories')->ignore($x)],'description'=>['nullable','string','max:255']]); }
}
