<?php

namespace App\Http\Controllers;

use App\Models\{InventoryMovement, Product, Service, Supplier};
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends ApiController
{
    public function dashboard(): array
    {
        return ['inventoryValue'=>(float)Product::selectRaw('COALESCE(SUM(quantity * purchase_price),0) total')->value('total'),'totalProducts'=>Product::where('active',true)->count(),'lowStock'=>Product::where('active',true)->whereColumn('quantity','<=','minimum_quantity')->count(),'pendingMovements'=>InventoryMovement::where('status','Pendiente')->count(),'upcomingServices'=>Service::whereNotIn('status',['Completado','Cancelado'])->whereBetween('scheduled_at',[now(),now()->addDays(7)])->count(),'overdueServices'=>Service::whereNotIn('status',['Completado','Cancelado'])->where('scheduled_at','<',now())->count()];
    }
    public function inventory(): array { return Product::with(['category','location'])->where('active',true)->orderBy('name')->get()->map(fn($p)=>$this->product($p)+['stockValue'=>(float)$p->quantity*(float)$p->purchase_price])->all(); }
    public function movements(Request $r): array { [$from,$to]=$this->range($r); return InventoryMovement::with(['items.product.category','creator'])->when($from,fn($q)=>$q->whereDate('movement_date','>=',$from))->when($to,fn($q)=>$q->whereDate('movement_date','<=',$to))->latest('movement_date')->get()->map(fn($m)=>$this->movement($m))->all(); }
    public function services(Request $r): array { [$from,$to]=$this->range($r); return Service::with(['client','assignedUsers'])->when($from,fn($q)=>$q->whereDate('scheduled_at','>=',$from))->when($to,fn($q)=>$q->whereDate('scheduled_at','<=',$to))->orderBy('scheduled_at')->get()->map(fn($s)=>$this->service($s))->all(); }
    public function suppliers(): array { return Supplier::withCount(['products','purchaseOrders'])->withSum('purchaseOrders','total')->orderBy('name')->get()->map(fn($s)=>['id'=>$s->id,'name'=>$s->name,'status'=>$s->status,'productCount'=>$s->products_count,'orderCount'=>$s->purchase_orders_count,'purchaseTotal'=>(float)($s->purchase_orders_sum_total??0)])->all(); }
    public function csv(Request $r,string $report): StreamedResponse
    {
        abort_unless(in_array($report,['inventory','movements','services','suppliers'],true),404); $rows=$this->{$report}($r); if(!is_array($rows)) $rows=[];
        return response()->streamDownload(function()use($rows){$stream=fopen('php://output','w'); if($rows){fputcsv($stream,array_keys($rows[0]),',','"',''); foreach($rows as $row) fputcsv($stream,array_map(fn($v)=>is_array($v)?json_encode($v,JSON_UNESCAPED_UNICODE):$v,$row),',','"','');} fclose($stream);},$report.'-'.now()->format('Ymd').'.csv',['Content-Type'=>'text/csv; charset=UTF-8']);
    }
    private function range(Request $r): array { $d=$r->validate(['from'=>'nullable|date','to'=>'nullable|date|after_or_equal:from']); return [$d['from']??null,$d['to']??null]; }
}
