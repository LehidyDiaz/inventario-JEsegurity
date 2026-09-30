<?php

namespace App\Http\Controllers;

use App\Models\{Client, Product, Service, Supplier, User};
use Illuminate\Http\Request;

class SearchController extends ApiController
{
    public function __invoke(Request $request): array
    {
        $q=$request->validate(['q'=>'required|string|min:2|max:100'])['q']; $like='%'.str_replace(['%','_'],['\\%','\\_'],$q).'%'; $results=collect();
        Product::where('active',true)->where(fn($x)=>$x->where('name','like',$like)->orWhere('sku','like',$like))->limit(10)->get()->each(fn($x)=>$results->push(['section'=>'products','id'=>$x->id,'title'=>$x->name,'subtitle'=>$x->sku,'action'=>"/products/{$x->id}"]));
        Service::where(fn($x)=>$x->where('title','like',$like)->orWhere('folio','like',$like))->limit(10)->get()->each(fn($x)=>$results->push(['section'=>'services','id'=>$x->id,'title'=>$x->title,'subtitle'=>$x->folio,'action'=>"/services/{$x->id}"]));
        Supplier::where('name','like',$like)->limit(10)->get()->each(fn($x)=>$results->push(['section'=>'suppliers','id'=>$x->id,'title'=>$x->name,'subtitle'=>$x->email,'action'=>"/suppliers/{$x->id}"]));
        Client::where('name','like',$like)->limit(10)->get()->each(fn($x)=>$results->push(['section'=>'clients','id'=>$x->id,'title'=>$x->name,'subtitle'=>$x->email,'action'=>"/clients/{$x->id}"]));
        User::where('status','!=','Inactivo')->where(fn($x)=>$x->where('full_name','like',$like)->orWhere('email','like',$like))->limit(10)->get()->each(fn($x)=>$results->push(['section'=>'users','id'=>$x->id,'title'=>$x->full_name,'subtitle'=>$x->email,'action'=>"/users/{$x->id}"]));
        return $results->take(40)->values()->all();
    }
}
