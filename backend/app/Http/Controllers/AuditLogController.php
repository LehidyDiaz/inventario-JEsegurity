<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends ApiController
{
    public function index(Request $request): array
    {
        $data=$request->validate(['action'=>'nullable|string|max:40','userId'=>'nullable|integer|exists:users,id','auditableType'=>'nullable|string|max:150','from'=>'nullable|date','to'=>'nullable|date|after_or_equal:from']);
        $logs=AuditLog::with('user')->when($data['action']??null,fn($q,$v)=>$q->where('action',$v))->when($data['userId']??null,fn($q,$v)=>$q->where('user_id',$v))->when($data['auditableType']??null,fn($q,$v)=>$q->where('auditable_type',$v))->when($data['from']??null,fn($q,$v)=>$q->whereDate('timestamp','>=',$v))->when($data['to']??null,fn($q,$v)=>$q->whereDate('timestamp','<=',$v))->latest('timestamp')->limit(500)->get();
        return $logs->map(fn($x)=>['id'=>$x->id,'userId'=>$x->user_id,'user'=>$x->user?->full_name,'action'=>$x->action,'auditableType'=>$x->auditable_type,'auditableId'=>$x->auditable_id,'description'=>$x->description,'oldValues'=>$x->old_values ?? [],'newValues'=>$x->new_values ?? [],'ip'=>$x->ip,'userAgent'=>$x->user_agent,'timestamp'=>$x->timestamp?->toISOString()])->all();
    }
}
