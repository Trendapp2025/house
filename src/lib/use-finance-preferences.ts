'use client';
import {useEffect,useState} from 'react';
import {emptyPreferences,type FinancePreferences} from '@/lib/purchase-finance';
export function useFinancePreferences(){
 const [preferences,setPreferences]=useState<FinancePreferences>(emptyPreferences),[ready,setReady]=useState(false);
 useEffect(()=>{try{const raw=JSON.parse(localStorage.getItem('houseid-finance')??'null');if(raw&&['deposit','rate','years'].every(k=>typeof raw[k]==='string'))setPreferences(raw);}catch{}setReady(true);},[]);
 function update(next:FinancePreferences){setPreferences(next);try{localStorage.setItem('houseid-finance',JSON.stringify(next));}catch{}}
 return {preferences,update,ready};
}
