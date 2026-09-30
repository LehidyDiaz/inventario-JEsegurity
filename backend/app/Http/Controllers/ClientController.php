<?php
namespace App\Http\Controllers;
use App\Models\Client;
use Illuminate\Http\{JsonResponse, Request};
class ClientController extends ApiController
{
    public function index(): array { return Client::orderBy('name')->get()->map(fn($x)=>$this->client($x))->all(); }
    public function store(Request $r): JsonResponse { $x=Client::create($this->map($this->data($r))); return response()->json($this->client($x),201); }
    public function update(Request $r, Client $client): array { $client->update($this->map($this->data($r))); return $this->client($client); }
    public function destroy(Client $client): JsonResponse { if($client->services()->exists()) return $this->conflict('El cliente tiene servicios asociados.'); $client->delete(); return response()->json(['message'=>'Cliente eliminado.']); }
    private function data(Request $r): array { return $r->validate(['name'=>['required','string','max:160'],'contact'=>['nullable','string','max:120'],'phone'=>['nullable','string','max:30'],'email'=>['nullable','email','max:160'],'address'=>['nullable','string','max:255']]); }
    private function map(array $d): array { $d['contact_name']=$d['contact']??null; unset($d['contact']); return $d; }
}
