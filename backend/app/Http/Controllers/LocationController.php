<?php
namespace App\Http\Controllers;
use App\Models\Location;
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Validation\Rule;
class LocationController extends ApiController
{
    public function index(): array { return Location::where('active', true)->orderBy('name')->get()->map(fn($x)=>$this->location($x))->all(); }
    public function store(Request $r): JsonResponse { $x=Location::create($this->data($r)); return response()->json($this->location($x),201); }
    public function update(Request $r, Location $location): array { $location->update($this->data($r,$location)); return $this->location($location); }
    public function destroy(Location $location): JsonResponse { $location->update(['active'=>false]); return response()->json(['message'=>'Ubicación desactivada.']); }
    private function data(Request $r, ?Location $x=null): array { return $r->validate(['name'=>['required','string','max:120',Rule::unique('locations')->ignore($x)],'address'=>['nullable','string','max:255'],'active'=>['sometimes','boolean']]); }
}
