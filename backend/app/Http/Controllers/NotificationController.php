<?php

namespace App\Http\Controllers;

use App\Models\{Notification, NotificationPreference};
use App\Services\NotificationService;
use Illuminate\Http\{JsonResponse, Request};

class NotificationController extends ApiController
{
    public function index(Request $request): array
    {
        $query = $request->user()->notifications()->latest();
        if ($request->boolean('unread')) $query->whereNull('read_at');
        return $query->get()->map(fn ($n) => $this->format($n))->all();
    }

    public function read(Request $request, Notification $notification): array
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
        $notification->update(['read_at' => $notification->read_at ?? now()]);
        return $this->format($notification);
    }

    public function readAll(Request $request): JsonResponse
    {
        $count = $request->user()->notifications()->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message'=>'Notificaciones marcadas como leídas.','updated'=>$count]);
    }

    public function preferences(Request $request): array
    {
        return $this->preference(NotificationPreference::firstOrCreate(['user_id'=>$request->user()->id]));
    }

    public function updatePreferences(Request $request): array
    {
        $data=$request->validate(['stock'=>'required|boolean','services'=>'required|boolean','movements'=>'required|boolean','expirations'=>'required|boolean','purchases'=>'required|boolean']);
        $preference=NotificationPreference::updateOrCreate(['user_id'=>$request->user()->id],$data);
        return $this->preference($preference);
    }

    public function refresh(NotificationService $service): array { return ['created'=>$service->generate()]; }

    private function format(Notification $n): array { return ['id'=>$n->id,'type'=>$n->type,'title'=>$n->title,'message'=>$n->message,'priority'=>$n->priority,'actionUrl'=>$n->action_url,'readAt'=>$n->read_at?->toISOString(),'data'=>$n->data ?? [],'createdAt'=>$n->created_at?->toISOString()]; }
    private function preference(NotificationPreference $p): array { return ['stock'=>$p->stock,'services'=>$p->services,'movements'=>$p->movements,'expirations'=>$p->expirations,'purchases'=>$p->purchases]; }
}
