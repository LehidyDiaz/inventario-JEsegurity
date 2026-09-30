<?php

namespace App\Http\Controllers;

use App\Models\{Attachment, InventoryMovement, Product, PurchaseOrder, Service};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends ApiController
{
    private const ENTITIES=['products'=>Product::class,'services'=>Service::class,'movements'=>InventoryMovement::class,'purchase-orders'=>PurchaseOrder::class];
    public function index(Request $request): array { $d=$request->validate(['entityType'=>['required',Rule::in(array_keys(self::ENTITIES))],'entityId'=>'required|integer']); $this->entity($d['entityType'],$d['entityId']); return Attachment::with('uploader')->where('entity_type',$d['entityType'])->where('entity_id',$d['entityId'])->latest()->get()->map(fn($x)=>$this->format($x))->all(); }
    public function store(Request $request): JsonResponse { $d=$request->validate(['entityType'=>['required',Rule::in(array_keys(self::ENTITIES))],'entityId'=>'required|integer','file'=>'required|file|mimes:jpg,jpeg,png,pdf,docx|max:10240']); $this->entity($d['entityType'],$d['entityId']); $file=$d['file']; $path=$file->store('attachments/'.$d['entityType'],'local'); $attachment=Attachment::create(['entity_type'=>$d['entityType'],'entity_id'=>$d['entityId'],'original_name'=>$file->getClientOriginalName(),'path'=>$path,'mime'=>$file->getMimeType() ?: 'application/octet-stream','size'=>$file->getSize(),'uploaded_by'=>$request->user()->id]); return response()->json($this->format($attachment->load('uploader')),201); }
    public function download(Attachment $attachment): StreamedResponse { abort_unless(Storage::disk('local')->exists($attachment->path),404); return Storage::disk('local')->download($attachment->path,$attachment->original_name,['Content-Type'=>$attachment->mime]); }
    public function destroy(Attachment $attachment): JsonResponse { Storage::disk('local')->delete($attachment->path); $attachment->delete(); return response()->json(['message'=>'Adjunto eliminado.']); }
    private function entity(string $type,int $id): void { abort_unless(self::ENTITIES[$type]::whereKey($id)->exists(),422,'La entidad indicada no existe.'); }
    private function format(Attachment $x): array { return ['id'=>$x->id,'entityType'=>$x->entity_type,'entityId'=>$x->entity_id,'originalName'=>$x->original_name,'mime'=>$x->mime,'size'=>$x->size,'uploadedBy'=>$x->uploaded_by,'uploader'=>$x->uploader?->full_name,'createdAt'=>$x->created_at?->toISOString(),'downloadUrl'=>url("/api/attachments/{$x->id}/download")]; }
}
