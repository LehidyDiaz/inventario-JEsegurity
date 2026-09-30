<?php
namespace App\Http\Controllers;
use App\Models\Service;
use App\Services\FolioService;
use Illuminate\Http\{JsonResponse, Request};
class ServiceController extends ApiController
{
    public function index(): array { return Service::with(['client','assignedUsers'])->orderBy('scheduled_at')->get()->map(fn($x)=>$this->service($x))->all(); }
    public function store(Request $r, FolioService $folios): JsonResponse { $d=$this->data($r); $ids=$d['assignedUserIds']; unset($d['assignedUserIds']); $d['created_by']=$r->user()->id; $d['folio']=$folios->next('SRV'); $x=Service::create($this->map($d)); $x->assignedUsers()->sync($ids); return response()->json($this->service($x->load(['client','assignedUsers'])),201); }
    public function update(Request $r, Service $service): array { $d=$this->data($r); $ids=$d['assignedUserIds']; unset($d['assignedUserIds']); $service->update($this->map($d)); $service->assignedUsers()->sync($ids); return $this->service($service->load(['client','assignedUsers'])); }
    public function destroy(Service $service): JsonResponse { if($service->movements()->exists()) return $this->conflict('El servicio tiene movimientos asociados.'); $service->delete(); return response()->json(['message'=>'Servicio eliminado.']); }
    private function data(Request $r): array { return $r->validate(['title'=>['required','string','max:180'],'clientId'=>['nullable','integer','exists:clients,id'],'location'=>['required','string','max:180'],'scheduledAt'=>['required','date'],'type'=>['required','in:Prevención,Mantenimiento,Capacitación'],'status'=>['required','in:Programado,En curso,Pendiente,Completado,Cancelado'],'notes'=>['nullable','string'],'assignedUserIds'=>['present','array'],'assignedUserIds.*'=>['integer','distinct','exists:users,id']]); }
    private function map(array $d): array { $d['client_id']=$d['clientId']??null; $d['scheduled_at']=$d['scheduledAt']; unset($d['clientId'],$d['scheduledAt']); return $d; }
}
