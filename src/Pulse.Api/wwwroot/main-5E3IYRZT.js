import{a as cn}from"./chunk-XL3MFFTU.js";import{b as dn}from"./chunk-6TWNBVAM.js";import{a as ln}from"./chunk-MFDBL2NY.js";import{a as nn,b as rn,c as on,d as an,e as sn}from"./chunk-SL5UZNAD.js";import"./chunk-PMGRBROH.js";import{c as ze,d as xe,f as J,g as We,h as le}from"./chunk-UXY6QH5L.js";import{a as j}from"./chunk-CVLVS2GQ.js";import{a as It,b as Rt}from"./chunk-NELH4SRA.js";import{a as tn}from"./chunk-4WJOAKPX.js";import{a as en}from"./chunk-FW23AZKX.js";import{a as Ee}from"./chunk-MTPB3H4Q.js";import"./chunk-LGSCEEYG.js";import{a as we,b as Dt,d as Ce,e as P,f as At,g as Ot,h as Nt}from"./chunk-RBFAUYYU.js";import"./chunk-DRZKVPZV.js";import{a as Xt}from"./chunk-7VYGDZDB.js";import"./chunk-EZTS2TUH.js";import"./chunk-A5SZELON.js";import"./chunk-5E4TBXIG.js";import"./chunk-ZAQJCETW.js";import{b as Vt,f as Ft,j as Lt,t as Bt}from"./chunk-Y56ENNOG.js";import{c as Me}from"./chunk-MBBRJZK6.js";import"./chunk-UOVIHFUE.js";import"./chunk-RNGSMQ52.js";import{d as Yt,e as ee,f as Jt,h as Qe}from"./chunk-ZXKQXRRB.js";import{b as qt,c as Zt,d as Kt,e as $t}from"./chunk-UVI2CVDY.js";import{f as q}from"./chunk-TOMJSKOQ.js";import{C as X,E as Ue,G as zt,M as Wt,P as Ut,Q as Qt,U as Ht,ba as Gt,ca as ke,da as Se,l as St,o as Mt,p as Et,s as Pt,t as Tt,w as jt,x as ye}from"./chunk-CZVMAR5M.js";import{$ as z,$a as ct,$b as d,Aa as at,Ab as gt,B as et,C as R,Ca as ge,Cb as Be,D as E,Ea as $,Eb as L,Fa as st,Fb as _,Fc as yt,Gb as v,H as tt,I as V,J as Re,Jb as ft,Jc as ve,Ka as lt,Kb as _t,Lb as B,Mb as o,Nb as a,Ob as Q,Rc as kt,Sc as be,T as Ve,U as ie,V as A,Vb as C,X as nt,Y as N,Z as it,Zb as m,a as Xe,aa as re,ab as g,ac as I,bc as x,ca as W,cc as se,da as Fe,dc as H,ea as l,eb as dt,ec as y,f as pe,fa as he,fb as Le,fc as k,h as M,hb as mt,ib as pt,jc as je,ka as h,kb as ht,kc as fe,la as u,lc as b,mc as vt,nc as s,oa as U,oc as G,pa as K,pb as w,pc as bt,qb as oe,rb as ut,sa as ue,sc as wt,t as D,ta as F,tc as Ct,ub as ae,uc as xt,wa as rt,wc as Y,xa as S,xc as _e,ya as ot}from"./chunk-65WL2JVZ.js";var kn="@",Sn=(()=>{class i{doc;delegate;zone;animationType;moduleImpl;_rendererFactoryPromise=null;scheduler=null;injector=l(U);loadingSchedulerFn=l(Mn,{optional:!0});_engine;constructor(e,t,n,c,p){this.doc=e,this.delegate=t,this.zone=n,this.animationType=c,this.moduleImpl=p}ngOnDestroy(){this._engine?.flush()}loadImpl(){let e=()=>this.moduleImpl??import("./chunk-N7A3PWYC.js").then(n=>n),t;return this.loadingSchedulerFn?t=this.loadingSchedulerFn(e):t=e(),t.catch(n=>{throw new N(5300,!1)}).then(({\u0275createEngine:n,\u0275AnimationRendererFactory:c})=>{this._engine=n(this.animationType,this.doc);let p=new c(this.delegate,this._engine,this.zone);return this.delegate=p,p})}createRenderer(e,t){let n=this.delegate.createRenderer(e,t);if(n.\u0275type===0)return n;typeof n.throwOnSyntheticProps=="boolean"&&(n.throwOnSyntheticProps=!1);let c=new He(n);return t?.data?.animation&&!this._rendererFactoryPromise&&(this._rendererFactoryPromise=this.loadImpl()),this._rendererFactoryPromise?.then(p=>{let O=p.createRenderer(e,t);c.use(O),this.scheduler??=this.injector.get(ot,null,{optional:!0}),this.scheduler?.notify(10)}).catch(p=>{c.use(n)}),c}begin(){this.delegate.begin?.()}end(){this.delegate.end?.()}whenRenderingDone(){return this.delegate.whenRenderingDone?.()??Promise.resolve()}componentReplaced(e){this._engine?.flush(),this.delegate.componentReplaced?.(e)}static \u0275fac=function(t){ht()};static \u0275prov=z({token:i,factory:i.\u0275fac})}return i})(),He=class{delegate;replay=[];\u0275type=1;constructor(r){this.delegate=r}use(r){if(this.delegate=r,this.replay!==null){for(let e of this.replay)e(r);this.replay=null}}get data(){return this.delegate.data}destroy(){this.replay=null,this.delegate.destroy()}createElement(r,e){return this.delegate.createElement(r,e)}createComment(r){return this.delegate.createComment(r)}createText(r){return this.delegate.createText(r)}get destroyNode(){return this.delegate.destroyNode}appendChild(r,e){this.delegate.appendChild(r,e)}insertBefore(r,e,t,n){this.delegate.insertBefore(r,e,t,n)}removeChild(r,e,t,n){this.delegate.removeChild(r,e,t,n)}selectRootElement(r,e){return this.delegate.selectRootElement(r,e)}parentNode(r){return this.delegate.parentNode(r)}nextSibling(r){return this.delegate.nextSibling(r)}setAttribute(r,e,t,n){this.delegate.setAttribute(r,e,t,n)}removeAttribute(r,e,t){this.delegate.removeAttribute(r,e,t)}addClass(r,e){this.delegate.addClass(r,e)}removeClass(r,e){this.delegate.removeClass(r,e)}setStyle(r,e,t,n){this.delegate.setStyle(r,e,t,n)}removeStyle(r,e,t){this.delegate.removeStyle(r,e,t)}setProperty(r,e,t){this.shouldReplay(e)&&this.replay.push(n=>n.setProperty(r,e,t)),this.delegate.setProperty(r,e,t)}setValue(r,e){this.delegate.setValue(r,e)}listen(r,e,t,n){return this.shouldReplay(e)&&this.replay.push(c=>c.listen(r,e,t,n)),this.delegate.listen(r,e,t,n)}shouldReplay(r){return this.replay!==null&&r.startsWith(kn)}},Mn=new W("");function mn(i="animations"){return dt("NgAsyncAnimations"),he([{provide:mt,useFactory:()=>new Sn(l(K),l(Mt),l(F),i)},{provide:lt,useValue:i==="noop"?"NoopAnimations":"BrowserAnimations"}])}var Ge="Service workers are disabled or not supported by this browser",te=class{serviceWorker;worker;registration;events;constructor(r,e){if(this.serviceWorker=r,!r)this.worker=this.events=this.registration=new pe(t=>t.error(new N(5601,!1)));else{let t=null,n=new M;this.worker=new pe(T=>(t!==null&&T.next(t),n.subscribe(me=>T.next(me))));let c=()=>{let{controller:T}=r;T!==null&&(t=T,n.next(t))};r.addEventListener("controllerchange",c),c(),this.registration=this.worker.pipe(ie(()=>r.getRegistration().then(T=>{if(!T)throw new N(5601,!1);return T})));let p=new M;this.events=p.asObservable();let O=T=>{let{data:me}=T;me?.type&&p.next(me)};r.addEventListener("message",O),e?.get(Be,null,{optional:!0})?.onDestroy(()=>{r.removeEventListener("controllerchange",c),r.removeEventListener("message",O)})}}postMessage(r,e){return new Promise(t=>{this.worker.pipe(V(1)).subscribe(n=>{n.postMessage(Xe({action:r},e)),t()})})}postMessageWithOperation(r,e,t){let n=this.waitForOperationCompleted(t),c=this.postMessage(r,e);return Promise.all([c,n]).then(([,p])=>p)}generateNonce(){return Math.round(Math.random()*1e7)}eventsOfType(r){let e;return typeof r=="string"?e=t=>t.type===r:e=t=>r.includes(t.type),this.events.pipe(E(e))}nextEventOfType(r){return this.eventsOfType(r).pipe(V(1))}waitForOperationCompleted(r){return new Promise((e,t)=>{this.eventsOfType("OPERATION_COMPLETED").pipe(E(n=>n.nonce===r),V(1),D(n=>{if(n.result!==void 0)return n.result;throw new Error(n.error)})).subscribe({next:e,error:t})})}get isEnabled(){return!!this.serviceWorker}},En=(()=>{class i{sw;messages;notificationClicks;notificationCloses;pushSubscriptionChanges;subscription;get isEnabled(){return this.sw.isEnabled}pushManager=null;subscriptionChanges=new M;constructor(e){if(this.sw=e,!e.isEnabled){this.messages=R,this.notificationClicks=R,this.notificationCloses=R,this.pushSubscriptionChanges=R,this.subscription=R;return}this.messages=this.sw.eventsOfType("PUSH").pipe(D(n=>n.data)),this.notificationClicks=this.sw.eventsOfType("NOTIFICATION_CLICK").pipe(D(n=>n.data)),this.notificationCloses=this.sw.eventsOfType("NOTIFICATION_CLOSE").pipe(D(n=>n.data)),this.pushSubscriptionChanges=this.sw.eventsOfType("PUSH_SUBSCRIPTION_CHANGE").pipe(D(n=>n.data)),this.pushManager=this.sw.registration.pipe(D(n=>n.pushManager));let t=this.pushManager.pipe(ie(n=>n.getSubscription()));this.subscription=new pe(n=>{let c=t.subscribe(n),p=this.subscriptionChanges.subscribe(n);return()=>{c.unsubscribe(),p.unsubscribe()}})}requestSubscription(e){if(!this.sw.isEnabled||this.pushManager===null)return Promise.reject(new Error(Ge));let t={userVisibleOnly:!0},n=this.decodeBase64(e.serverPublicKey.replace(/_/g,"/").replace(/-/g,"+")),c=new Uint8Array(new ArrayBuffer(n.length));for(let p=0;p<n.length;p++)c[p]=n.charCodeAt(p);return t.applicationServerKey=c,new Promise((p,O)=>{this.pushManager.pipe(ie(ne=>ne.subscribe(t)),V(1)).subscribe({next:ne=>{this.subscriptionChanges.next(ne),p(ne)},error:O})})}unsubscribe(){if(!this.sw.isEnabled)return Promise.reject(new Error(Ge));let e=t=>{if(t===null)throw new N(5602,!1);return t.unsubscribe().then(n=>{if(!n)throw new N(5603,!1);this.subscriptionChanges.next(null)})};return new Promise((t,n)=>{this.subscription.pipe(V(1),ie(e)).subscribe({next:t,error:n})})}decodeBase64(e){return atob(e)}static \u0275fac=function(t){return new(t||i)(Fe(te))};static \u0275prov=z({token:i,factory:i.\u0275fac})}return i})(),qe=(()=>{class i{sw;versionUpdates;unrecoverable;get isEnabled(){return this.sw.isEnabled}ongoingCheckForUpdate=null;constructor(e){if(this.sw=e,!e.isEnabled){this.versionUpdates=R,this.unrecoverable=R;return}this.versionUpdates=this.sw.eventsOfType(["VERSION_DETECTED","VERSION_INSTALLATION_FAILED","VERSION_READY","NO_NEW_VERSION_DETECTED"]),this.unrecoverable=this.sw.eventsOfType("UNRECOVERABLE_STATE")}checkForUpdate(){if(!this.sw.isEnabled)return Promise.reject(new Error(Ge));if(this.ongoingCheckForUpdate)return this.ongoingCheckForUpdate;let e=this.sw.generateNonce();return this.ongoingCheckForUpdate=this.sw.postMessageWithOperation("CHECK_FOR_UPDATES",{nonce:e},e).finally(()=>{this.ongoingCheckForUpdate=null}),this.ongoingCheckForUpdate}activateUpdate(){if(!this.sw.isEnabled)return Promise.reject(new N(5601,!1));let e=this.sw.generateNonce();return this.sw.postMessageWithOperation("ACTIVATE_UPDATE",{nonce:e},e)}static \u0275fac=function(t){return new(t||i)(Fe(te))};static \u0275prov=z({token:i,factory:i.\u0275fac})}return i})(),hn=new W("");function Pn(){let i=l(ce);if(!("serviceWorker"in navigator&&i.enabled!==!1))return;let r=l(hn),e=l(F),t=l(Be);e.runOutsideAngular(()=>{let n=navigator.serviceWorker,c=()=>n.controller?.postMessage({action:"INITIALIZE"});n.addEventListener("controllerchange",c),t.onDestroy(()=>{n.removeEventListener("controllerchange",c)})}),e.runOutsideAngular(()=>{let n,{registrationStrategy:c}=i;if(typeof c=="function")n=new Promise(p=>c().subscribe(()=>p()));else{let[p,...O]=(c||"registerWhenStable:30000").split(":");switch(p){case"registerImmediately":n=Promise.resolve();break;case"registerWithDelay":n=pn(+O[0]||0);break;case"registerWhenStable":n=Promise.race([t.whenStable(),pn(+O[0])]);break;default:throw new N(5600,!1)}}n.then(()=>{t.destroyed||navigator.serviceWorker.register(r,{scope:i.scope,updateViaCache:i.updateViaCache,type:i.type}).catch(p=>console.error(it(5604,!1)))})})}function pn(i){return new Promise(r=>setTimeout(r,i))}function Tn(){let i=l(ce),r=l(U),e=!0;return new te(e&&i.enabled!==!1?navigator.serviceWorker:void 0,r)}var ce=class{enabled;updateViaCache;type;scope;registrationStrategy};function un(i,r={}){return he([En,qe,{provide:hn,useValue:i},{provide:ce,useValue:r},{provide:te,useFactory:Tn},gt(Pn)])}var f=async()=>{let i=l(j),r=l(P);return i.isAuthenticated()||await i.checkAuth()?!0:(r.navigate(["/login"]),!1)};var gn=()=>{let i=l(j),r=l(P);return i.isAdmin()?!0:(r.navigate(["/dashboard"]),!1)};var fn=[{path:"login",loadComponent:()=>import("./chunk-TLHEYLSC.js").then(i=>i.LoginComponent)},{path:"",redirectTo:"dashboard",pathMatch:"full"},{path:"dashboard",loadComponent:()=>import("./chunk-3LLMLKM7.js").then(i=>i.DashboardComponent),canActivate:[f]},{path:"loans",loadComponent:()=>import("./chunk-AQIUCXMJ.js").then(i=>i.LoanListComponent),canActivate:[f]},{path:"loans/:id",loadComponent:()=>import("./chunk-QXWTNVN5.js").then(i=>i.LoanDetailComponent),canActivate:[f]},{path:"cards",loadComponent:()=>import("./chunk-LW5A2VSV.js").then(i=>i.CardListComponent),canActivate:[f]},{path:"cards/:id",loadComponent:()=>import("./chunk-3MVQGU3Q.js").then(i=>i.CardDetailComponent),canActivate:[f]},{path:"strategies",loadComponent:()=>import("./chunk-BCATF5KB.js").then(i=>i.StrategyComparisonComponent),canActivate:[f]},{path:"simulator",loadComponent:()=>import("./chunk-QLA3FM7I.js").then(i=>i.WhatIfComponent),canActivate:[f]},{path:"budget",loadComponent:()=>import("./chunk-IGTB26FZ.js").then(i=>i.BudgetPageComponent),canActivate:[f]},{path:"accounts",loadComponent:()=>import("./chunk-BSH3XSHD.js").then(i=>i.AccountListComponent),canActivate:[f]},{path:"expenses",loadComponent:()=>import("./chunk-GOPVBFBD.js").then(i=>i.ExpensesPageComponent),canActivate:[f]},{path:"categories",loadComponent:()=>import("./chunk-SD76IOGY.js").then(i=>i.CategoryPageComponent),canActivate:[f]},{path:"payments",loadComponent:()=>import("./chunk-R4PWYD2T.js").then(i=>i.PaymentHistoryComponent),canActivate:[f]},{path:"recurring",loadComponent:()=>import("./chunk-KC4LE63G.js").then(i=>i.RecurringPageComponent),canActivate:[f]},{path:"goals",loadComponent:()=>import("./chunk-4MKFC5IB.js").then(i=>i.GoalsPageComponent),canActivate:[f]},{path:"health",loadComponent:()=>import("./chunk-BPVMLF6P.js").then(i=>i.HealthDashboardComponent),canActivate:[f]},{path:"health/metrics",loadComponent:()=>import("./chunk-72GAV7AN.js").then(i=>i.MetricsLogComponent),canActivate:[f]},{path:"health/blood-work",loadComponent:()=>import("./chunk-64BPN5KU.js").then(i=>i.BloodWorkPageComponent),canActivate:[f]},{path:"health/plans",loadComponent:()=>import("./chunk-K4UYEQ5N.js").then(i=>i.WorkoutPlansComponent),canActivate:[f]},{path:"health/workout",loadComponent:()=>import("./chunk-VQF4GUEC.js").then(i=>i.TodayWorkoutComponent),canActivate:[f]},{path:"health/progress",loadComponent:()=>import("./chunk-245SGLGV.js").then(i=>i.ProgressComponent),canActivate:[f]},{path:"trading",loadComponent:()=>import("./chunk-DEVP6SSS.js").then(i=>i.TradingDashboardComponent),canActivate:[f]},{path:"trading/premarket",loadComponent:()=>import("./chunk-34P2FM7U.js").then(i=>i.PremarketComponent),canActivate:[f]},{path:"trading/setups",loadComponent:()=>import("./chunk-2YSF53ZM.js").then(i=>i.SetupsComponent),canActivate:[f]},{path:"trading/checklist",loadComponent:()=>import("./chunk-KVW5XIAZ.js").then(i=>i.ChecklistComponent),canActivate:[f]},{path:"trading/journal",loadComponent:()=>import("./chunk-A5XK3TY2.js").then(i=>i.JournalComponent),canActivate:[f]},{path:"trading/review",loadComponent:()=>import("./chunk-WMFKXM66.js").then(i=>i.ReviewComponent),canActivate:[f]},{path:"trading/playbook",loadComponent:()=>import("./chunk-7S6NCLRH.js").then(i=>i.PlaybookComponent),canActivate:[f]},{path:"trading/weekly",loadComponent:()=>import("./chunk-73HJCGD5.js").then(i=>i.WeeklySummaryComponent),canActivate:[f]},{path:"admin/users",loadComponent:()=>import("./chunk-J3SLBLUE.js").then(i=>i.UserManagementComponent),canActivate:[f,gn]}];var Dn=(i,r)=>{let e=l(P);return r(i).pipe(nt({error:t=>{t.status===401&&!i.url.includes("/api/auth/")&&e.navigate(["/login"])}}))},_n={providers:[rt(),yt(),Nt(fn),Pt(Tt([Dn])),mn(),Rt(It()),un("ngsw-worker.js",{enabled:!kt(),registrationStrategy:"registerWhenStable:30000"})]};var De=["*"],On=["content"],Nn=[[["mat-drawer"]],[["mat-drawer-content"]],"*"],In=["mat-drawer","mat-drawer-content","*"];function Rn(i,r){if(i&1){let e=C();o(0,"div",1),m("click",function(){h(e);let n=d();return u(n._onBackdropClicked())}),a()}if(i&2){let e=d();b("mat-drawer-shown",e._isShowingBackdrop())}}function Vn(i,r){i&1&&(o(0,"mat-drawer-content"),x(1,2),a())}var Fn=[[["mat-sidenav"]],[["mat-sidenav-content"]],"*"],Ln=["mat-sidenav","mat-sidenav-content","*"];function Bn(i,r){if(i&1){let e=C();o(0,"div",1),m("click",function(){h(e);let n=d();return u(n._onBackdropClicked())}),a()}if(i&2){let e=d();b("mat-drawer-shown",e._isShowingBackdrop())}}function jn(i,r){i&1&&(o(0,"mat-sidenav-content"),x(1,2),a())}var zn=`.mat-drawer-container {
  position: relative;
  z-index: 1;
  color: var(--mat-sidenav-content-text-color, var(--mat-sys-on-background));
  background-color: var(--mat-sidenav-content-background-color, var(--mat-sys-background));
  box-sizing: border-box;
  display: block;
  overflow: hidden;
}
.mat-drawer-container[fullscreen] {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.mat-drawer-container[fullscreen].mat-drawer-container-has-open {
  overflow: hidden;
}
.mat-drawer-container.mat-drawer-container-explicit-backdrop .mat-drawer-side {
  z-index: 3;
}
.mat-drawer-container.ng-animate-disabled .mat-drawer-backdrop,
.mat-drawer-container.ng-animate-disabled .mat-drawer-content, .ng-animate-disabled .mat-drawer-container .mat-drawer-backdrop,
.ng-animate-disabled .mat-drawer-container .mat-drawer-content {
  transition: none;
}

.mat-drawer-backdrop {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  display: block;
  z-index: 3;
  visibility: hidden;
}
.mat-drawer-backdrop.mat-drawer-shown {
  visibility: visible;
  background-color: var(--mat-sidenav-scrim-color, color-mix(in srgb, var(--mat-sys-neutral-variant20) 40%, transparent));
}
.mat-drawer-transition .mat-drawer-backdrop {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: background-color, visibility;
}
@media (forced-colors: active) {
  .mat-drawer-backdrop {
    opacity: 0.5;
  }
}

.mat-drawer-content {
  position: relative;
  z-index: 1;
  display: block;
  height: 100%;
  overflow: auto;
}
.mat-drawer-content.mat-drawer-content-hidden {
  opacity: 0;
}
.mat-drawer-transition .mat-drawer-content {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: transform, margin-left, margin-right;
}

.mat-drawer {
  position: relative;
  z-index: 4;
  color: var(--mat-sidenav-container-text-color, var(--mat-sys-on-surface-variant));
  box-shadow: var(--mat-sidenav-container-elevation-shadow, none);
  background-color: var(--mat-sidenav-container-background-color, var(--mat-sys-surface));
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  width: var(--mat-sidenav-container-width, 360px);
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  outline: 0;
  box-sizing: border-box;
  overflow-y: auto;
  transform: translate3d(-100%, 0, 0);
}
@media (forced-colors: active) {
  .mat-drawer, [dir=rtl] .mat-drawer.mat-drawer-end {
    border-right: solid 1px currentColor;
  }
}
@media (forced-colors: active) {
  [dir=rtl] .mat-drawer, .mat-drawer.mat-drawer-end {
    border-left: solid 1px currentColor;
    border-right: none;
  }
}
.mat-drawer.mat-drawer-side {
  z-index: 2;
}
.mat-drawer.mat-drawer-end {
  right: 0;
  transform: translate3d(100%, 0, 0);
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[dir=rtl] .mat-drawer {
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  transform: translate3d(100%, 0, 0);
}
[dir=rtl] .mat-drawer.mat-drawer-end {
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  left: 0;
  right: auto;
  transform: translate3d(-100%, 0, 0);
}
.mat-drawer-transition .mat-drawer {
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) {
  visibility: hidden;
  box-shadow: none;
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) .mat-drawer-inner-container {
  display: none;
}
.mat-drawer.mat-drawer-opened.mat-drawer-opened {
  transform: none;
}

.mat-drawer-side {
  box-shadow: none;
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
}
.mat-drawer-side.mat-drawer-end {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side.mat-drawer-end {
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
  border-left: none;
}

.mat-drawer-inner-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.mat-sidenav-fixed {
  position: fixed;
}
`;var Wn=new W("MAT_DRAWER_DEFAULT_AUTOSIZE",{providedIn:"root",factory:()=>!1}),$e=new W("MAT_DRAWER_CONTAINER"),Pe=(()=>{class i extends ee{_platform=l(X);_changeDetectorRef=l(be);_container=l(Ke);constructor(){let e=l($),t=l(Yt),n=l(F);super(e,t,n)}ngAfterContentInit(){this._container._contentMarginChanges.subscribe(()=>{this._changeDetectorRef.markForCheck()})}_shouldBeHidden(){if(this._platform.isBrowser)return!1;let{start:e,end:t}=this._container;return e!=null&&e.mode!=="over"&&e.opened||t!=null&&t.mode!=="over"&&t.opened}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=w({type:i,selectors:[["mat-drawer-content"]],hostAttrs:[1,"mat-drawer-content"],hostVars:6,hostBindings:function(t,n){t&2&&(fe("margin-left",n._container._contentMargins.left,"px")("margin-right",n._container._contentMargins.right,"px"),b("mat-drawer-content-hidden",n._shouldBeHidden()))},features:[Y([{provide:ee,useExisting:i}]),ae],ngContentSelectors:De,decls:1,vars:0,template:function(t,n){t&1&&(I(),x(0))},encapsulation:2,changeDetection:0})}return i})(),Ze=(()=>{class i{_elementRef=l($);_focusTrapFactory=l(Qt);_focusMonitor=l(zt);_platform=l(X);_ngZone=l(F);_renderer=l(pt);_interactivityChecker=l(Ut);_doc=l(K);_container=l($e,{optional:!0});_focusTrap=null;_elementFocusedBeforeDrawerWasOpened=null;_eventCleanups;_isAttached=!1;_anchor=null;get position(){return this._position}set position(e){e=e==="end"?"end":"start",e!==this._position&&(this._isAttached&&this._updatePositionInParent(e),this._position=e,this.onPositionChanged.emit())}_position="start";get mode(){return this._mode}set mode(e){this._mode=e,this._updateFocusTrapState(),this._modeChanged.next()}_mode="over";get disableClose(){return this._disableClose}set disableClose(e){this._disableClose=q(e)}_disableClose=!1;get autoFocus(){let e=this._autoFocus;return e??(this.mode==="side"?"dialog":"first-tabbable")}set autoFocus(e){(e==="true"||e==="false"||e==null)&&(e=q(e)),this._autoFocus=e}_autoFocus;get opened(){return this._opened()}set opened(e){this.toggle(q(e))}_opened=S(!1);_openedVia=null;_animationStarted=new M;_animationEnd=new M;openedChange=new ue(!0);_openedStream=this.openedChange.pipe(E(e=>e),D(()=>{}));openedStart=this._animationStarted.pipe(E(()=>this.opened),Re(void 0));_closedStream=this.openedChange.pipe(E(e=>!e),D(()=>{}));closedStart=this._animationStarted.pipe(E(()=>!this.opened),Re(void 0));_destroyed=new M;onPositionChanged=new ue;_content;_modeChanged=new M;_injector=l(U);_changeDetectorRef=l(be);constructor(){this.openedChange.pipe(A(this._destroyed)).subscribe(e=>{e?(this._elementFocusedBeforeDrawerWasOpened=this._doc.activeElement,this._takeFocus()):this._isFocusWithinDrawer()&&this._restoreFocus(this._openedVia||"program")}),this._eventCleanups=this._ngZone.runOutsideAngular(()=>{let e=this._renderer,t=this._elementRef.nativeElement;return[e.listen(t,"keydown",n=>{n.keyCode===27&&!this.disableClose&&!Ht(n)&&this._ngZone.run(()=>{this.close(),n.stopPropagation(),n.preventDefault()})}),e.listen(t,"transitionend",this._handleTransitionEvent),e.listen(t,"transitioncancel",this._handleTransitionEvent)]}),this._animationEnd.subscribe(()=>{this.openedChange.emit(this.opened)})}_forceFocus(e,t){this._interactivityChecker.isFocusable(e)||(e.tabIndex=-1,this._ngZone.runOutsideAngular(()=>{let n=()=>{c(),p(),e.removeAttribute("tabindex")},c=this._renderer.listen(e,"blur",n),p=this._renderer.listen(e,"mousedown",n)})),e.focus(t)}_focusByCssSelector(e,t){let n=this._elementRef.nativeElement.querySelector(e);n&&this._forceFocus(n,t)}_takeFocus(){if(!this._focusTrap)return;let e=this._elementRef.nativeElement;switch(this.autoFocus){case!1:case"dialog":return;case!0:case"first-tabbable":Le(()=>{!this._focusTrap.focusInitialElement()&&typeof e.focus=="function"&&e.focus()},{injector:this._injector});break;case"first-heading":this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]');break;default:this._focusByCssSelector(this.autoFocus);break}}_restoreFocus(e){this.autoFocus!=="dialog"&&(this._elementFocusedBeforeDrawerWasOpened?this._focusMonitor.focusVia(this._elementFocusedBeforeDrawerWasOpened,e):this._elementRef.nativeElement.blur(),this._elementFocusedBeforeDrawerWasOpened=null)}_isFocusWithinDrawer(){let e=this._doc.activeElement;return!!e&&this._elementRef.nativeElement.contains(e)}ngAfterViewInit(){this._isAttached=!0,this._position==="end"&&this._updatePositionInParent("end"),this._platform.isBrowser&&(this._focusTrap=this._focusTrapFactory.create(this._elementRef.nativeElement),this._updateFocusTrapState())}ngOnDestroy(){this._eventCleanups.forEach(e=>e()),this._focusTrap?.destroy(),this._anchor?.remove(),this._anchor=null,this._animationStarted.complete(),this._animationEnd.complete(),this._modeChanged.complete(),this._destroyed.next(),this._destroyed.complete()}open(e){return this.toggle(!0,e)}close(){return this.toggle(!1)}_closeViaBackdropClick(){return this._setOpen(!1,!0,"mouse")}toggle(e=!this.opened,t){e&&t&&(this._openedVia=t);let n=this._setOpen(e,!e&&this._isFocusWithinDrawer(),this._openedVia||"program");return e||(this._openedVia=null),n}_setOpen(e,t,n){return e===this.opened?Promise.resolve(e?"open":"close"):(this._opened.set(e),this._container?._transitionsEnabled?(this._setIsAnimating(!0),setTimeout(()=>this._animationStarted.next())):setTimeout(()=>{this._animationStarted.next(),this._animationEnd.next()}),this._elementRef.nativeElement.classList.toggle("mat-drawer-opened",e),!e&&t&&this._restoreFocus(n),this._changeDetectorRef.markForCheck(),this._updateFocusTrapState(),new Promise(c=>{this.openedChange.pipe(V(1)).subscribe(p=>c(p?"open":"close"))}))}_setIsAnimating(e){this._elementRef.nativeElement.classList.toggle("mat-drawer-animating",e)}_getWidth(){return this._elementRef.nativeElement.offsetWidth||0}_updateFocusTrapState(){this._focusTrap&&(this._focusTrap.enabled=this.opened&&!!this._container?._isShowingBackdrop())}_updatePositionInParent(e){if(!this._platform.isBrowser)return;let t=this._elementRef.nativeElement,n=t.parentNode;e==="end"?(this._anchor||(this._anchor=this._doc.createComment("mat-drawer-anchor"),n.insertBefore(this._anchor,t)),n.appendChild(t)):this._anchor&&this._anchor.parentNode.insertBefore(t,this._anchor)}_handleTransitionEvent=e=>{let t=this._elementRef.nativeElement;e.target===t&&this._ngZone.run(()=>{e.type==="transitionend"&&this._setIsAnimating(!1),this._animationEnd.next(e)})};static \u0275fac=function(t){return new(t||i)};static \u0275cmp=w({type:i,selectors:[["mat-drawer"]],viewQuery:function(t,n){if(t&1&&H(On,5),t&2){let c;y(c=k())&&(n._content=c.first)}},hostAttrs:[1,"mat-drawer"],hostVars:12,hostBindings:function(t,n){t&2&&(L("align",null)("tabIndex",n.mode!=="side"?"-1":null),fe("visibility",!n._container&&!n.opened?"hidden":null),b("mat-drawer-end",n.position==="end")("mat-drawer-over",n.mode==="over")("mat-drawer-push",n.mode==="push")("mat-drawer-side",n.mode==="side"))},inputs:{position:"position",mode:"mode",disableClose:"disableClose",autoFocus:"autoFocus",opened:"opened"},outputs:{openedChange:"openedChange",_openedStream:"opened",openedStart:"openedStart",_closedStream:"closed",closedStart:"closedStart",onPositionChanged:"positionChanged"},exportAs:["matDrawer"],ngContentSelectors:De,decls:3,vars:0,consts:[["content",""],["cdkScrollable","",1,"mat-drawer-inner-container"]],template:function(t,n){t&1&&(I(),o(0,"div",1,0),x(2),a())},dependencies:[ee],encapsulation:2,changeDetection:0})}return i})(),Ke=(()=>{class i{_dir=l(jt,{optional:!0});_element=l($);_ngZone=l(F);_changeDetectorRef=l(be);_animationDisabled=Gt();_transitionsEnabled=!1;_allDrawers;_drawers=new st;_content;_userContent;get start(){return this._start}get end(){return this._end}get autosize(){return this._autosize}set autosize(e){this._autosize=q(e)}_autosize=l(Wn);get hasBackdrop(){return this._drawerHasBackdrop(this._start)||this._drawerHasBackdrop(this._end)}set hasBackdrop(e){this._backdropOverride=e==null?null:q(e)}_backdropOverride=null;backdropClick=new ue;_start=null;_end=null;_left=null;_right=null;_destroyed=new M;_doCheckSubject=new M;_contentMargins={left:null,right:null};_contentMarginChanges=new M;get scrollable(){return this._userContent||this._content}_injector=l(U);constructor(){let e=l(X),t=l(Jt);this._dir?.change.pipe(A(this._destroyed)).subscribe(()=>{this._validateDrawers(),this.updateContentMargins()}),t.change().pipe(A(this._destroyed)).subscribe(()=>this.updateContentMargins()),!this._animationDisabled&&e.isBrowser&&this._ngZone.runOutsideAngular(()=>{setTimeout(()=>{this._element.nativeElement.classList.add("mat-drawer-transition"),this._transitionsEnabled=!0},200)})}ngAfterContentInit(){this._allDrawers.changes.pipe(Ve(this._allDrawers),A(this._destroyed)).subscribe(e=>{this._drawers.reset(e.filter(t=>!t._container||t._container===this)),this._drawers.notifyOnChanges()}),this._drawers.changes.pipe(Ve(null)).subscribe(()=>{this._validateDrawers(),this._drawers.forEach(e=>{this._watchDrawerToggle(e),this._watchDrawerPosition(e),this._watchDrawerMode(e)}),(!this._drawers.length||this._isDrawerOpen(this._start)||this._isDrawerOpen(this._end))&&this.updateContentMargins(),this._changeDetectorRef.markForCheck()}),this._ngZone.runOutsideAngular(()=>{this._doCheckSubject.pipe(tt(10),A(this._destroyed)).subscribe(()=>this.updateContentMargins())})}ngOnDestroy(){this._contentMarginChanges.complete(),this._doCheckSubject.complete(),this._drawers.destroy(),this._destroyed.next(),this._destroyed.complete()}open(){this._drawers.forEach(e=>e.open())}close(){this._drawers.forEach(e=>e.close())}updateContentMargins(){let e=0,t=0;if(this._left&&this._left.opened){if(this._left.mode=="side")e+=this._left._getWidth();else if(this._left.mode=="push"){let n=this._left._getWidth();e+=n,t-=n}}if(this._right&&this._right.opened){if(this._right.mode=="side")t+=this._right._getWidth();else if(this._right.mode=="push"){let n=this._right._getWidth();t+=n,e-=n}}e=e||null,t=t||null,(e!==this._contentMargins.left||t!==this._contentMargins.right)&&(this._contentMargins={left:e,right:t},this._ngZone.run(()=>this._contentMarginChanges.next(this._contentMargins)))}ngDoCheck(){this._autosize&&this._isPushed()&&this._ngZone.runOutsideAngular(()=>this._doCheckSubject.next())}_watchDrawerToggle(e){e._animationStarted.pipe(A(this._drawers.changes)).subscribe(()=>{this.updateContentMargins(),this._changeDetectorRef.markForCheck()}),e.mode!=="side"&&e.openedChange.pipe(A(this._drawers.changes)).subscribe(()=>this._setContainerClass(e.opened))}_watchDrawerPosition(e){e.onPositionChanged.pipe(A(this._drawers.changes)).subscribe(()=>{Le({read:()=>this._validateDrawers()},{injector:this._injector})})}_watchDrawerMode(e){e._modeChanged.pipe(A(et(this._drawers.changes,this._destroyed))).subscribe(()=>{this.updateContentMargins(),this._changeDetectorRef.markForCheck()})}_setContainerClass(e){let t=this._element.nativeElement.classList,n="mat-drawer-container-has-open";e?t.add(n):t.remove(n)}_validateDrawers(){this._start=this._end=null,this._drawers.forEach(e=>{e.position=="end"?(this._end!=null,this._end=e):(this._start!=null,this._start=e)}),this._right=this._left=null,this._dir&&this._dir.value==="rtl"?(this._left=this._end,this._right=this._start):(this._left=this._start,this._right=this._end)}_isPushed(){return this._isDrawerOpen(this._start)&&this._start.mode!="over"||this._isDrawerOpen(this._end)&&this._end.mode!="over"}_onBackdropClicked(){this.backdropClick.emit(),this._closeModalDrawersViaBackdrop()}_closeModalDrawersViaBackdrop(){[this._start,this._end].filter(e=>e&&!e.disableClose&&this._drawerHasBackdrop(e)).forEach(e=>e._closeViaBackdropClick())}_isShowingBackdrop(){return this._isDrawerOpen(this._start)&&this._drawerHasBackdrop(this._start)||this._isDrawerOpen(this._end)&&this._drawerHasBackdrop(this._end)}_isDrawerOpen(e){return e!=null&&e.opened}_drawerHasBackdrop(e){return this._backdropOverride==null?!!e&&e.mode!=="side":this._backdropOverride}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=w({type:i,selectors:[["mat-drawer-container"]],contentQueries:function(t,n,c){if(t&1&&se(c,Pe,5)(c,Ze,5),t&2){let p;y(p=k())&&(n._content=p.first),y(p=k())&&(n._allDrawers=p)}},viewQuery:function(t,n){if(t&1&&H(Pe,5),t&2){let c;y(c=k())&&(n._userContent=c.first)}},hostAttrs:[1,"mat-drawer-container"],hostVars:2,hostBindings:function(t,n){t&2&&b("mat-drawer-container-explicit-backdrop",n._backdropOverride)},inputs:{autosize:"autosize",hasBackdrop:"hasBackdrop"},outputs:{backdropClick:"backdropClick"},exportAs:["matDrawerContainer"],features:[Y([{provide:$e,useExisting:i}])],ngContentSelectors:In,decls:4,vars:2,consts:[[1,"mat-drawer-backdrop",3,"mat-drawer-shown"],[1,"mat-drawer-backdrop",3,"click"]],template:function(t,n){t&1&&(I(Nn),_(0,Rn,1,2,"div",0),x(1),x(2,1),_(3,Vn,2,0,"mat-drawer-content")),t&2&&(v(n.hasBackdrop?0:-1),g(3),v(n._content?-1:3))},dependencies:[Pe],styles:[`.mat-drawer-container {
  position: relative;
  z-index: 1;
  color: var(--mat-sidenav-content-text-color, var(--mat-sys-on-background));
  background-color: var(--mat-sidenav-content-background-color, var(--mat-sys-background));
  box-sizing: border-box;
  display: block;
  overflow: hidden;
}
.mat-drawer-container[fullscreen] {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.mat-drawer-container[fullscreen].mat-drawer-container-has-open {
  overflow: hidden;
}
.mat-drawer-container.mat-drawer-container-explicit-backdrop .mat-drawer-side {
  z-index: 3;
}
.mat-drawer-container.ng-animate-disabled .mat-drawer-backdrop,
.mat-drawer-container.ng-animate-disabled .mat-drawer-content, .ng-animate-disabled .mat-drawer-container .mat-drawer-backdrop,
.ng-animate-disabled .mat-drawer-container .mat-drawer-content {
  transition: none;
}

.mat-drawer-backdrop {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  display: block;
  z-index: 3;
  visibility: hidden;
}
.mat-drawer-backdrop.mat-drawer-shown {
  visibility: visible;
  background-color: var(--mat-sidenav-scrim-color, color-mix(in srgb, var(--mat-sys-neutral-variant20) 40%, transparent));
}
.mat-drawer-transition .mat-drawer-backdrop {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: background-color, visibility;
}
@media (forced-colors: active) {
  .mat-drawer-backdrop {
    opacity: 0.5;
  }
}

.mat-drawer-content {
  position: relative;
  z-index: 1;
  display: block;
  height: 100%;
  overflow: auto;
}
.mat-drawer-content.mat-drawer-content-hidden {
  opacity: 0;
}
.mat-drawer-transition .mat-drawer-content {
  transition-duration: 400ms;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  transition-property: transform, margin-left, margin-right;
}

.mat-drawer {
  position: relative;
  z-index: 4;
  color: var(--mat-sidenav-container-text-color, var(--mat-sys-on-surface-variant));
  box-shadow: var(--mat-sidenav-container-elevation-shadow, none);
  background-color: var(--mat-sidenav-container-background-color, var(--mat-sys-surface));
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  width: var(--mat-sidenav-container-width, 360px);
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  outline: 0;
  box-sizing: border-box;
  overflow-y: auto;
  transform: translate3d(-100%, 0, 0);
}
@media (forced-colors: active) {
  .mat-drawer, [dir=rtl] .mat-drawer.mat-drawer-end {
    border-right: solid 1px currentColor;
  }
}
@media (forced-colors: active) {
  [dir=rtl] .mat-drawer, .mat-drawer.mat-drawer-end {
    border-left: solid 1px currentColor;
    border-right: none;
  }
}
.mat-drawer.mat-drawer-side {
  z-index: 2;
}
.mat-drawer.mat-drawer-end {
  right: 0;
  transform: translate3d(100%, 0, 0);
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[dir=rtl] .mat-drawer {
  border-top-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-left-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  transform: translate3d(100%, 0, 0);
}
[dir=rtl] .mat-drawer.mat-drawer-end {
  border-top-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-bottom-right-radius: var(--mat-sidenav-container-shape, var(--mat-sys-corner-large));
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  left: 0;
  right: auto;
  transform: translate3d(-100%, 0, 0);
}
.mat-drawer-transition .mat-drawer {
  transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) {
  visibility: hidden;
  box-shadow: none;
}
.mat-drawer:not(.mat-drawer-opened):not(.mat-drawer-animating) .mat-drawer-inner-container {
  display: none;
}
.mat-drawer.mat-drawer-opened.mat-drawer-opened {
  transform: none;
}

.mat-drawer-side {
  box-shadow: none;
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
}
.mat-drawer-side.mat-drawer-end {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side {
  border-left-color: var(--mat-sidenav-container-divider-color, transparent);
  border-left-width: 1px;
  border-left-style: solid;
  border-right: none;
}
[dir=rtl] .mat-drawer-side.mat-drawer-end {
  border-right-color: var(--mat-sidenav-container-divider-color, transparent);
  border-right-width: 1px;
  border-right-style: solid;
  border-left: none;
}

.mat-drawer-inner-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.mat-sidenav-fixed {
  position: fixed;
}
`],encapsulation:2,changeDetection:0})}return i})(),Te=(()=>{class i extends Pe{static \u0275fac=(()=>{let e;return function(n){return(e||(e=ge(i)))(n||i)}})();static \u0275cmp=w({type:i,selectors:[["mat-sidenav-content"]],hostAttrs:[1,"mat-drawer-content","mat-sidenav-content"],features:[Y([{provide:ee,useExisting:i}]),ae],ngContentSelectors:De,decls:1,vars:0,template:function(t,n){t&1&&(I(),x(0))},encapsulation:2,changeDetection:0})}return i})(),Ye=(()=>{class i extends Ze{get fixedInViewport(){return this._fixedInViewport}set fixedInViewport(e){this._fixedInViewport=q(e)}_fixedInViewport=!1;get fixedTopGap(){return this._fixedTopGap}set fixedTopGap(e){this._fixedTopGap=Ue(e)}_fixedTopGap=0;get fixedBottomGap(){return this._fixedBottomGap}set fixedBottomGap(e){this._fixedBottomGap=Ue(e)}_fixedBottomGap=0;static \u0275fac=(()=>{let e;return function(n){return(e||(e=ge(i)))(n||i)}})();static \u0275cmp=w({type:i,selectors:[["mat-sidenav"]],hostAttrs:[1,"mat-drawer","mat-sidenav"],hostVars:16,hostBindings:function(t,n){t&2&&(L("tabIndex",n.mode!=="side"?"-1":null)("align",null),fe("top",n.fixedInViewport?n.fixedTopGap:null,"px")("bottom",n.fixedInViewport?n.fixedBottomGap:null,"px"),b("mat-drawer-end",n.position==="end")("mat-drawer-over",n.mode==="over")("mat-drawer-push",n.mode==="push")("mat-drawer-side",n.mode==="side")("mat-sidenav-fixed",n.fixedInViewport))},inputs:{fixedInViewport:"fixedInViewport",fixedTopGap:"fixedTopGap",fixedBottomGap:"fixedBottomGap"},exportAs:["matSidenav"],features:[Y([{provide:Ze,useExisting:i}]),ae],ngContentSelectors:De,decls:3,vars:0,consts:[["content",""],["cdkScrollable","",1,"mat-drawer-inner-container"]],template:function(t,n){t&1&&(I(),o(0,"div",1,0),x(2),a())},dependencies:[ee],encapsulation:2,changeDetection:0})}return i})(),vn=(()=>{class i extends Ke{_allDrawers=void 0;_content=void 0;static \u0275fac=(()=>{let e;return function(n){return(e||(e=ge(i)))(n||i)}})();static \u0275cmp=w({type:i,selectors:[["mat-sidenav-container"]],contentQueries:function(t,n,c){if(t&1&&se(c,Te,5)(c,Ye,5),t&2){let p;y(p=k())&&(n._content=p.first),y(p=k())&&(n._allDrawers=p)}},hostAttrs:[1,"mat-drawer-container","mat-sidenav-container"],hostVars:2,hostBindings:function(t,n){t&2&&b("mat-drawer-container-explicit-backdrop",n._backdropOverride)},exportAs:["matSidenavContainer"],features:[Y([{provide:$e,useExisting:i},{provide:Ke,useExisting:i}]),ae],ngContentSelectors:Ln,decls:4,vars:2,consts:[[1,"mat-drawer-backdrop",3,"mat-drawer-shown"],[1,"mat-drawer-backdrop",3,"click"]],template:function(t,n){t&1&&(I(Fn),_(0,Bn,1,2,"div",0),x(1),x(2,1),_(3,jn,2,0,"mat-sidenav-content")),t&2&&(v(n.hasBackdrop?0:-1),g(3),v(n._content?-1:3))},dependencies:[Te],styles:[zn],encapsulation:2,changeDetection:0})}return i})(),bn=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275mod=oe({type:i});static \u0275inj=re({imports:[Qe,ye,Qe]})}return i})();var Qn=["*",[["mat-toolbar-row"]]],Hn=["*","mat-toolbar-row"],Gn=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275dir=ut({type:i,selectors:[["mat-toolbar-row"]],hostAttrs:[1,"mat-toolbar-row"],exportAs:["matToolbarRow"]})}return i})(),wn=(()=>{class i{_elementRef=l($);_platform=l(X);_document=l(K);color;_toolbarRows;constructor(){}ngAfterViewInit(){this._platform.isBrowser&&(this._checkToolbarMixedModes(),this._toolbarRows.changes.subscribe(()=>this._checkToolbarMixedModes()))}_checkToolbarMixedModes(){this._toolbarRows.length}static \u0275fac=function(t){return new(t||i)};static \u0275cmp=w({type:i,selectors:[["mat-toolbar"]],contentQueries:function(t,n,c){if(t&1&&se(c,Gn,5),t&2){let p;y(p=k())&&(n._toolbarRows=p)}},hostAttrs:[1,"mat-toolbar"],hostVars:6,hostBindings:function(t,n){t&2&&(vt(n.color?"mat-"+n.color:""),b("mat-toolbar-multiple-rows",n._toolbarRows.length>0)("mat-toolbar-single-row",n._toolbarRows.length===0))},inputs:{color:"color"},exportAs:["matToolbar"],ngContentSelectors:Hn,decls:2,vars:0,template:function(t,n){t&1&&(I(Qn),x(0),x(1,1))},styles:[`.mat-toolbar {
  background: var(--mat-toolbar-container-background-color, var(--mat-sys-surface));
  color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
}
.mat-toolbar, .mat-toolbar h1, .mat-toolbar h2, .mat-toolbar h3, .mat-toolbar h4, .mat-toolbar h5, .mat-toolbar h6 {
  font-family: var(--mat-toolbar-title-text-font, var(--mat-sys-title-large-font));
  font-size: var(--mat-toolbar-title-text-size, var(--mat-sys-title-large-size));
  line-height: var(--mat-toolbar-title-text-line-height, var(--mat-sys-title-large-line-height));
  font-weight: var(--mat-toolbar-title-text-weight, var(--mat-sys-title-large-weight));
  letter-spacing: var(--mat-toolbar-title-text-tracking, var(--mat-sys-title-large-tracking));
  margin: 0;
}
@media (forced-colors: active) {
  .mat-toolbar {
    outline: solid 1px;
  }
}
.mat-toolbar .mat-form-field-underline,
.mat-toolbar .mat-form-field-ripple,
.mat-toolbar .mat-focused .mat-form-field-ripple {
  background-color: currentColor;
}
.mat-toolbar .mat-form-field-label,
.mat-toolbar .mat-focused .mat-form-field-label,
.mat-toolbar .mat-select-value,
.mat-toolbar .mat-select-arrow,
.mat-toolbar .mat-form-field.mat-focused .mat-select-arrow {
  color: inherit;
}
.mat-toolbar .mat-input-element {
  caret-color: currentColor;
}
.mat-toolbar .mat-mdc-button-base.mat-mdc-button-base.mat-unthemed {
  --mat-button-text-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
  --mat-button-outlined-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
}

.mat-toolbar-row, .mat-toolbar-single-row {
  display: flex;
  box-sizing: border-box;
  padding: 0 16px;
  width: 100%;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  height: var(--mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-row, .mat-toolbar-single-row {
    height: var(--mat-toolbar-mobile-height, 56px);
  }
}

.mat-toolbar-multiple-rows {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  width: 100%;
  min-height: var(--mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-multiple-rows {
    min-height: var(--mat-toolbar-mobile-height, 56px);
  }
}
`],encapsulation:2,changeDetection:0})}return i})();var Cn=(()=>{class i{static \u0275fac=function(t){return new(t||i)};static \u0275mod=oe({type:i});static \u0275inj=re({imports:[ye]})}return i})();var Ae=class i{theme=S(this.getStoredTheme());mediaQuery=window.matchMedia("(prefers-color-scheme: dark)");constructor(){at(()=>{let r=this.theme();localStorage.setItem("pulse_theme",r),this.applyTheme(r)}),this.mediaQuery.addEventListener("change",()=>{this.theme()==="system"&&this.applyTheme("system")})}toggle(){let r=["light","dark","system"],e=r.indexOf(this.theme());this.theme.set(r[(e+1)%r.length])}isDark(){let r=this.theme();return r==="system"?this.mediaQuery.matches:r==="dark"}getStoredTheme(){let r=localStorage.getItem("pulse_theme");return r==="light"||r==="dark"||r==="system"?r:"system"}applyTheme(r){let e=document.documentElement;e.classList.remove("light","dark"),r==="system"?this.mediaQuery.matches&&e.classList.add("dark"):e.classList.add(r)}static \u0275fac=function(e){return new(e||i)};static \u0275prov=z({token:i,factory:i.\u0275fac,providedIn:"root"})};var Kn=["searchInput"],$n=(i,r)=>r.label;function Yn(i,r){i&1&&(o(0,"span",12),s(1,"Action"),a())}function Jn(i,r){if(i&1){let e=C();o(0,"div",10),m("click",function(){let n=h(e).$implicit,c=d(2);return u(c.select(n))})("mouseenter",function(){let n=h(e).$index,c=d(2);return u(c.selectedIndex.set(n))}),o(1,"mat-icon",4),s(2),a(),o(3,"span",11),s(4),a(),_(5,Yn,2,0,"span",12),a()}if(i&2){let e=r.$implicit,t=r.$index,n=d(2);b("active",t===n.selectedIndex()),B("id","palette-item-"+t),L("aria-selected",t===n.selectedIndex()),g(2),G(e.icon),g(2),G(e.label),g(),v(e.action?5:-1)}}function Xn(i,r){if(i&1&&(o(0,"div",9),s(1),a()),i&2){let e=d(2);g(),bt('No results for "',e.query,'"')}}function ei(i,r){if(i&1){let e=C();o(0,"div",1),m("click",function(){h(e);let n=d();return u(n.close())}),a(),o(1,"div",2)(2,"div",3)(3,"mat-icon",4),s(4,"search"),a(),o(5,"input",5,0),xt("ngModelChange",function(n){h(e);let c=d();return Ct(c.query,n)||(c.query=n),u(n)}),m("input",function(){h(e);let n=d();return u(n.filter())})("keydown",function(n){h(e);let c=d();return u(c.onKeydown(n))}),a(),o(7,"span",6),s(8,"ESC"),a()(),o(9,"div",7),ft(10,Jn,6,7,"div",8,$n),_(12,Xn,2,1,"div",9),a()()}if(i&2){let e=d();g(5),wt("ngModel",e.query),L("aria-activedescendant","palette-item-"+e.selectedIndex()),g(5),_t(e.filtered()),g(2),v(e.filtered().length===0?12:-1)}}var ti=[{label:"Dashboard",icon:"dashboard",route:"/dashboard",keywords:["home","overview"]},{label:"My Loans",icon:"account_balance",route:"/loans",keywords:["debt","personal loan"]},{label:"My Cards",icon:"credit_card",route:"/cards",keywords:["credit","visa","mastercard"]},{label:"Bank Accounts",icon:"savings",route:"/accounts",keywords:["checking","savings","bank"]},{label:"Transactions",icon:"swap_horiz",route:"/expenses",keywords:["expense","income","spending"]},{label:"Budget",icon:"pie_chart",route:"/budget",keywords:["budget","allocate","plan"]},{label:"Recurring",icon:"repeat",route:"/recurring",keywords:["subscription","bill","auto"]},{label:"Goals",icon:"flag",route:"/goals",keywords:["savings","target","goal"]},{label:"Categories",icon:"category",route:"/categories",keywords:["tag","organize"]},{label:"Payoff Strategies",icon:"trending_down",route:"/strategies",keywords:["avalanche","snowball","payoff"]},{label:"What-If Simulator",icon:"science",route:"/simulator",keywords:["simulate","extra payment","what if"]},{label:"Payments",icon:"receipt_long",route:"/payments",keywords:["payment","history","record"]}],ni=[{label:"Log Transaction",icon:"add_circle",action:"add-expense",keywords:["expense","log","record","new"]},{label:"Add Loan",icon:"add",action:"add-loan",keywords:["new loan"]},{label:"Add Credit Card",icon:"add",action:"add-card",keywords:["new card"]},{label:"Add Goal",icon:"add",action:"add-goal",keywords:["new goal"]},{label:"Reset Demo Data",icon:"restart_alt",action:"reseed",keywords:["reset","seed","demo","sample","clear"]}],Oe=[...ti,...ni],de=class i{searchInput;router=l(P);dialog=l(Me);adminService=l(cn);notify=l(Ee);isOpen=S(!1);query="";filtered=S(Oe);selectedIndex=S(0);handleKeydown(r){(r.metaKey||r.ctrlKey)&&r.key==="k"&&(r.preventDefault(),this.open()),r.key==="Escape"&&this.isOpen()&&this.close()}open(){this.query="",this.filtered.set(Oe),this.selectedIndex.set(0),this.isOpen.set(!0),setTimeout(()=>this.searchInput?.nativeElement?.focus(),0)}close(){this.isOpen.set(!1)}filter(){let r=this.query.toLowerCase().trim();r?this.filtered.set(Oe.filter(e=>e.label.toLowerCase().includes(r)||e.keywords.some(t=>t.toLowerCase().includes(r)))):this.filtered.set(Oe),this.selectedIndex.set(0)}onKeydown(r){let e=this.filtered();r.key==="ArrowDown"?(r.preventDefault(),this.selectedIndex.set((this.selectedIndex()+1)%e.length)):r.key==="ArrowUp"?(r.preventDefault(),this.selectedIndex.set((this.selectedIndex()-1+e.length)%e.length)):r.key==="Enter"&&(r.preventDefault(),e.length>0&&this.select(e[this.selectedIndex()]))}select(r){this.close(),r.route?this.router.navigate([r.route]):r.action&&this.handleAction(r.action)}handleAction(r){switch(r){case"add-expense":import("./chunk-FU3IKRGG.js").then(e=>{this.dialog.open(e.AddExpenseDialogComponent,{width:"480px",data:{expense:null}})});break;case"add-loan":this.router.navigate(["/loans"],{queryParams:{action:"add"}});break;case"add-card":this.router.navigate(["/cards"],{queryParams:{action:"add"}});break;case"add-goal":this.router.navigate(["/goals"],{queryParams:{action:"add"}});break;case"reseed":this.adminService.reseed().subscribe({next:()=>{this.notify.success("Demo data reset successfully. Refreshing..."),setTimeout(()=>window.location.reload(),1500)},error:()=>this.notify.error("Failed to reset demo data")});break}}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=w({type:i,selectors:[["app-command-palette"]],viewQuery:function(e,t){if(e&1&&H(Kn,5),e&2){let n;y(n=k())&&(t.searchInput=n.first)}},hostBindings:function(e,t){e&1&&m("keydown",function(c){return t.handleKeydown(c)},ct)},decls:1,vars:1,consts:[["searchInput",""],["aria-hidden","true",1,"palette-backdrop",3,"click"],["role","dialog","aria-label","Command palette",1,"palette-container"],[1,"palette-input-wrap"],["aria-hidden","true"],["type","text","placeholder","Search pages, actions...","aria-label","Search pages and actions","autocomplete","off","role","combobox","aria-expanded","true","aria-controls","palette-results",3,"ngModelChange","input","keydown","ngModel"],["aria-hidden","true",1,"palette-shortcut"],["id","palette-results","role","listbox",1,"palette-results"],["role","option",1,"palette-item",3,"active","id"],["role","status",1,"palette-empty"],["role","option",1,"palette-item",3,"click","mouseenter","id"],[1,"palette-item-label"],[1,"palette-badge"]],template:function(e,t){e&1&&_(0,ei,13,3),e&2&&v(t.isOpen()?0:-1)},dependencies:[St,Se,ke,Bt,Vt,Ft,Lt],styles:[".palette-backdrop[_ngcontent-%COMP%]{position:fixed;inset:0;background:#00000080;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);z-index:9998}.palette-container[_ngcontent-%COMP%]{position:fixed;top:20%;left:50%;transform:translate(-50%);width:560px;max-width:90vw;max-height:420px;background:var(--color-surface);border-radius:var(--radius-lg);box-shadow:var(--shadow-float);z-index:9999;overflow:hidden;display:flex;flex-direction:column}.palette-input-wrap[_ngcontent-%COMP%]{display:flex;align-items:center;padding:14px 16px;gap:10px;border-bottom:1px solid var(--color-border)}.palette-input-wrap[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--color-text-secondary);font-size:22px;width:22px;height:22px}.palette-input-wrap[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]{flex:1;border:none;outline:none;font-size:1rem;font-family:var(--font-primary);background:transparent;color:var(--color-text)}.palette-shortcut[_ngcontent-%COMP%]{font-size:.7rem;padding:2px 6px;border-radius:4px;background:var(--color-surface-secondary);color:var(--color-text-secondary);font-weight:500}.palette-results[_ngcontent-%COMP%]{overflow-y:auto;padding:8px}.palette-item[_ngcontent-%COMP%]{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--radius-sm);cursor:pointer;transition:background .1s}.palette-item[_ngcontent-%COMP%]:hover, .palette-item.active[_ngcontent-%COMP%]{background:var(--color-surface-hover)}.palette-item[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--color-text-secondary);font-size:20px;width:20px;height:20px}.palette-item.active[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--color-primary)}.palette-item-label[_ngcontent-%COMP%]{font-size:var(--text-sm);font-weight:500}.palette-badge[_ngcontent-%COMP%]{margin-left:auto;font-size:.65rem;padding:2px 8px;border-radius:var(--radius-full);background:#007aff1a;color:var(--color-primary);font-weight:600;text-transform:uppercase}.palette-empty[_ngcontent-%COMP%]{text-align:center;padding:20px;color:var(--color-text-muted);font-size:var(--text-sm)}"]})};var yn=ze("routeAnimation",[We("* <=> *",[le(":enter",[J({opacity:0,position:"absolute",width:"100%"})],{optional:!0}),le(":leave",[J({opacity:1,position:"absolute",width:"100%"}),xe("150ms ease-out",J({opacity:0}))],{optional:!0}),le(":enter",[xe("150ms ease-in",J({opacity:1}))],{optional:!0})])]);var ii=["sidenav"],Je=()=>({exact:!0});function ri(i,r){if(i&1){let e=C();o(0,"div",11)(1,"a",28),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(2,"mat-icon",29),s(3,"dashboard"),a(),o(4,"span",30),s(5,"Dashboard"),a()(),o(6,"a",31),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(7,"mat-icon",29),s(8,"account_balance"),a(),o(9,"span",30),s(10,"My Loans"),a()(),o(11,"a",32),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(12,"mat-icon",29),s(13,"credit_card"),a(),o(14,"span",30),s(15,"My Cards"),a()(),o(16,"a",33),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(17,"mat-icon",29),s(18,"savings"),a(),o(19,"span",30),s(20,"Bank Accounts"),a()(),o(21,"a",34),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(22,"mat-icon",29),s(23,"swap_horiz"),a(),o(24,"span",30),s(25,"Transactions"),a()(),o(26,"a",35),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(27,"mat-icon",29),s(28,"pie_chart"),a(),o(29,"span",30),s(30,"Budget"),a()(),o(31,"a",36),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(32,"mat-icon",29),s(33,"repeat"),a(),o(34,"span",30),s(35,"Recurring"),a()(),o(36,"a",37),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(37,"mat-icon",29),s(38,"flag"),a(),o(39,"span",30),s(40,"Goals"),a()(),o(41,"a",38),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(42,"mat-icon",29),s(43,"category"),a(),o(44,"span",30),s(45,"Categories"),a()(),o(46,"a",39),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(47,"mat-icon",29),s(48,"trending_down"),a(),o(49,"span",30),s(50,"Payoff Strategies"),a()(),o(51,"a",40),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(52,"mat-icon",29),s(53,"science"),a(),o(54,"span",30),s(55,"What-If Simulator"),a()(),o(56,"a",41),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(57,"mat-icon",29),s(58,"receipt_long"),a(),o(59,"span",30),s(60,"Payments"),a()()()}}function oi(i,r){if(i&1){let e=C();o(0,"div",11)(1,"a",42),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(2,"mat-icon",29),s(3,"candlestick_chart"),a(),o(4,"span",30),s(5,"Trading Hub"),a()(),o(6,"a",43),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(7,"mat-icon",29),s(8,"wb_twilight"),a(),o(9,"span",30),s(10,"Pre-Market"),a()(),o(11,"a",44),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(12,"mat-icon",29),s(13,"checklist"),a(),o(14,"span",30),s(15,"Trade Checklist"),a()(),o(16,"a",45),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(17,"mat-icon",29),s(18,"auto_stories"),a(),o(19,"span",30),s(20,"Trade Journal"),a()(),o(21,"a",46),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(22,"mat-icon",29),s(23,"grading"),a(),o(24,"span",30),s(25,"Daily Review"),a()(),o(26,"a",47),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(27,"mat-icon",29),s(28,"tune"),a(),o(29,"span",30),s(30,"My Setups"),a()(),o(31,"a",48),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(32,"mat-icon",29),s(33,"menu_book"),a(),o(34,"span",30),s(35,"Playbook & Rules"),a()(),o(36,"a",49),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(37,"mat-icon",29),s(38,"analytics"),a(),o(39,"span",30),s(40,"Weekly Summary"),a()()()}i&2&&(g(),B("routerLinkActiveOptions",_e(1,Je)))}function ai(i,r){if(i&1){let e=C();o(0,"div",11)(1,"a",50),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(2,"mat-icon",29),s(3,"monitoring"),a(),o(4,"span",30),s(5,"Health Dashboard"),a()(),o(6,"a",51),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(7,"mat-icon",29),s(8,"straighten"),a(),o(9,"span",30),s(10,"Vitals & Metrics"),a()(),o(11,"a",52),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(12,"mat-icon",29),s(13,"bloodtype"),a(),o(14,"span",30),s(15,"Blood Work"),a()(),o(16,"a",53),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(17,"mat-icon",29),s(18,"fitness_center"),a(),o(19,"span",30),s(20,"Workout Plans"),a()(),o(21,"a",54),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(22,"mat-icon",29),s(23,"exercise"),a(),o(24,"span",30),s(25,"Today's Workout"),a()(),o(26,"a",55),m("click",function(){h(e);let n=d();return u(n.onNavClick())}),o(27,"mat-icon",29),s(28,"emoji_events"),a(),o(29,"span",30),s(30,"Progress & PRs"),a()()()}i&2&&(g(),B("routerLinkActiveOptions",_e(1,Je)))}function si(i,r){if(i&1){let e=C();o(0,"div",11)(1,"a",56),m("click",function(){h(e);let n=d(2);return u(n.onNavClick())}),o(2,"mat-icon",29),s(3,"admin_panel_settings"),a(),o(4,"span",30),s(5,"User Management"),a()()()}}function li(i,r){if(i&1){let e=C();o(0,"div",8),m("click",function(){h(e);let n=d();return u(n.toggleSection("admin"))}),o(1,"span",9),s(2,"Admin"),a(),o(3,"mat-icon",10),s(4,"expand_more"),a()(),_(5,si,6,0,"div",11)}if(i&2){let e=d();b("expanded",e.expandedSections().includes("admin")),g(5),v(e.expandedSections().includes("admin")?5:-1)}}function ci(i,r){if(i&1){let e=C();o(0,"button",57),m("click",function(){h(e),d();let n=je(2);return u(n.toggle())}),o(1,"mat-icon"),s(2,"menu"),a()()}}function di(i,r){i&1&&(o(0,"a",14)(1,"mat-icon",58),s(2,"monitor_heart"),a()())}function mi(i,r){if(i&1){let e=C();o(0,"nav",27)(1,"a",59)(2,"mat-icon"),s(3,"dashboard"),a(),o(4,"span"),s(5,"Home"),a()(),o(6,"a",60)(7,"mat-icon"),s(8,"swap_horiz"),a(),o(9,"span"),s(10,"Transactions"),a()(),o(11,"a",61)(12,"mat-icon"),s(13,"candlestick_chart"),a(),o(14,"span"),s(15,"Trading"),a()(),o(16,"a",62)(17,"mat-icon"),s(18,"monitoring"),a(),o(19,"span"),s(20,"Health"),a()(),o(21,"button",63),m("click",function(){h(e),d();let n=je(2);return u(n.toggle())}),o(22,"mat-icon"),s(23,"more_horiz"),a(),o(24,"span"),s(25,"More"),a()()()}i&2&&(g(),B("routerLinkActiveOptions",_e(1,Je)))}var Ne=class i{sidenav;commandPalette;breakpointObserver=l(Wt);router=l(P);contexts=l(Dt);authService=l(j);expenseService=l(tn);notify=l(Ee);themeService=l(Ae);dialog=l(Me);bottomSheet=l(dn);healthMetricService=l(ln);isMobile=S(!1);isPhone=S(!1);pageTitle=S("Dashboard");expandedSections=S(["finance","trading","health"]);userEmail=ve(()=>this.authService.currentUser()?.email??"");isAdmin=ve(()=>this.authService.isAdmin());pageTitles={"/dashboard":"Dashboard","/loans":"My Loans","/cards":"My Cards","/accounts":"Bank Accounts","/strategies":"Payoff Strategies","/simulator":"What-If Simulator","/budget":"Budget","/expenses":"Transactions","/categories":"Categories","/recurring":"Recurring","/goals":"Goals","/payments":"Payments","/health":"Health Dashboard","/health/metrics":"Vitals & Metrics","/health/blood-work":"Blood Work","/health/plans":"Workout Plans","/health/workout":"Today's Workout","/health/progress":"Progress & PRs","/trading":"Trading Hub","/trading/premarket":"Pre-Market Plan","/trading/checklist":"Trade Checklist","/trading/journal":"Trade Journal","/trading/review":"Daily Review","/trading/setups":"My Setups","/trading/playbook":"Playbook & Rules","/trading/weekly":"Weekly Summary","/admin":"User Management","/admin/users":"User Management"};constructor(){this.breakpointObserver.observe(["(max-width: 768px)"]).subscribe(e=>{this.isMobile.set(e.matches)}),this.breakpointObserver.observe(["(max-width: 599px)"]).subscribe(e=>{this.isPhone.set(e.matches)});let r=this.router.url;this.pageTitle.set(this.pageTitles[r]??this.pageTitles["/"+r.split("/")[1]]??"Pulse"),this.router.events.pipe(E(e=>e instanceof we)).subscribe(e=>{let t=e.urlAfterRedirects,n="/"+t.split("/")[1];this.pageTitle.set(this.pageTitles[t]??this.pageTitles[n]??"Pulse"),this.expandSectionForRoute(t),this.isMobile()&&this.sidenav&&this.sidenav.close()})}onNavClick(){this.isMobile()&&this.sidenav.close()}toggleSection(r){let e=this.expandedSections();e.includes(r)?this.expandedSections.set(e.filter(t=>t!==r)):this.expandedSections.set([...e,r])}expandSectionForRoute(r){let e="finance";r.startsWith("/trading")?e="trading":r.startsWith("/health")?e="health":r.startsWith("/admin")&&(e="admin");let t=this.expandedSections();t.includes(e)||this.expandedSections.set([...t,e])}logout(){this.authService.logout()}openQuickExpense(){this.isMobile()?import("./chunk-S4XE7WVM.js").then(r=>{this.bottomSheet.open(r.TxnTypeSheetComponent).afterDismissed().subscribe(t=>{t==="LogMetric"?this.openMetricDialog():t&&this.openExpenseDialog(t)})}):this.openExpenseDialog()}openExpenseDialog(r){import("./chunk-FU3IKRGG.js").then(e=>{this.dialog.open(e.AddExpenseDialogComponent,{width:"480px",maxWidth:"95vw",data:{expense:null,preselectedType:r}}).afterClosed().subscribe(n=>{n&&(n.splits?this.expenseService.createSplit(n.splits).subscribe({next:()=>this.notify.success("Transaction saved"),error:c=>this.notify.error(c.error?.message||"Failed to save transaction")}):this.expenseService.create(n).subscribe({next:()=>this.notify.success("Transaction saved"),error:c=>this.notify.error(c.error?.message||"Failed to save transaction")}))})})}openMetricDialog(){import("./chunk-WNA3R5K2.js").then(r=>{this.dialog.open(r.AddMetricDialogComponent,{width:"420px",maxWidth:"95vw"}).afterClosed().subscribe(t=>{t&&this.healthMetricService.create(t).subscribe({next:()=>this.notify.success("Metric logged"),error:()=>this.notify.error("Failed to save metric")})})})}toggleTheme(){this.themeService.toggle()}themeIcon=ve(()=>{let r=this.themeService.theme();return r==="dark"?"dark_mode":r==="light"?"light_mode":"brightness_auto"});openPalette(){this.commandPalette.open()}getRouteAnimationData(){return this.contexts.getContext("primary")?.route?.snapshot?.url.toString()??""}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=w({type:i,selectors:[["app-nav-shell"]],viewQuery:function(e,t){if(e&1&&H(ii,5)(de,5),e&2){let n;y(n=k())&&(t.sidenav=n.first),y(n=k())&&(t.commandPalette=n.first)}},decls:61,vars:21,consts:[["sidenav",""],[1,"shell-container"],["fixedTopGap","0",1,"sidenav",3,"mode","opened","fixedInViewport"],[1,"sidenav-header"],["routerLink","/dashboard",1,"brand"],[1,"brand-icon"],[1,"brand-name"],[1,"nav-list"],[1,"nav-section-header",3,"click"],[1,"section-label"],[1,"section-chevron"],[1,"nav-section-items"],[1,"app-toolbar"],["mat-icon-button","","aria-label","Toggle menu"],["routerLink","/dashboard",1,"mobile-brand"],[1,"toolbar-title"],[1,"toolbar-spacer"],["mat-icon-button","","matTooltip","Toggle theme",1,"theme-toggle",3,"click"],["mat-button","","aria-label","Search",1,"search-trigger",3,"click"],[1,"search-hint"],[1,"search-kbd"],[1,"user-info"],[1,"user-avatar"],[1,"user-email"],["mat-icon-button","","aria-label","Logout","matTooltip","Logout",3,"click"],[1,"content-area"],["mat-fab","","aria-label","Log expense",1,"global-fab",3,"click"],["role","navigation","aria-label","Main navigation",1,"bottom-tabs"],["mat-list-item","","routerLink","/dashboard","routerLinkActive","active-link",3,"click"],["matListItemIcon",""],["matListItemTitle",""],["mat-list-item","","routerLink","/loans","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/cards","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/accounts","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/expenses","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/budget","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/recurring","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/goals","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/categories","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/strategies","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/simulator","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/payments","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/trading","routerLinkActive","active-link",3,"click","routerLinkActiveOptions"],["mat-list-item","","routerLink","/trading/premarket","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/trading/checklist","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/trading/journal","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/trading/review","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/trading/setups","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/trading/playbook","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/trading/weekly","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/health","routerLinkActive","active-link",3,"click","routerLinkActiveOptions"],["mat-list-item","","routerLink","/health/metrics","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/health/blood-work","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/health/plans","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/health/workout","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/health/progress","routerLinkActive","active-link",3,"click"],["mat-list-item","","routerLink","/admin/users","routerLinkActive","active-link",3,"click"],["mat-icon-button","","aria-label","Toggle menu",3,"click"],[1,"mobile-brand-icon"],["routerLink","/dashboard","routerLinkActive","tab-active",1,"tab-item",3,"routerLinkActiveOptions"],["routerLink","/expenses","routerLinkActive","tab-active",1,"tab-item"],["routerLink","/trading","routerLinkActive","tab-active",1,"tab-item"],["routerLink","/health","routerLinkActive","tab-active",1,"tab-item"],["aria-label","More navigation",1,"tab-item",3,"click"]],template:function(e,t){e&1&&(o(0,"mat-sidenav-container",1)(1,"mat-sidenav",2,0)(3,"div",3)(4,"a",4)(5,"mat-icon",5),s(6,"monitor_heart"),a(),o(7,"span",6),s(8,"Pulse"),a()()(),o(9,"mat-nav-list",7)(10,"div",8),m("click",function(){return t.toggleSection("finance")}),o(11,"span",9),s(12,"Finance"),a(),o(13,"mat-icon",10),s(14,"expand_more"),a()(),_(15,ri,61,0,"div",11),o(16,"div",8),m("click",function(){return t.toggleSection("trading")}),o(17,"span",9),s(18,"Trading"),a(),o(19,"mat-icon",10),s(20,"expand_more"),a()(),_(21,oi,41,2,"div",11),o(22,"div",8),m("click",function(){return t.toggleSection("health")}),o(23,"span",9),s(24,"Health & Fitness"),a(),o(25,"mat-icon",10),s(26,"expand_more"),a()(),_(27,ai,31,2,"div",11),_(28,li,6,3),a()(),o(29,"mat-sidenav-content")(30,"mat-toolbar",12),_(31,ci,3,0,"button",13),_(32,di,3,0,"a",14),o(33,"span",15),s(34),a(),Q(35,"span",16),o(36,"button",17),m("click",function(){return t.toggleTheme()}),o(37,"mat-icon"),s(38),a()(),o(39,"button",18),m("click",function(){return t.openPalette()}),o(40,"mat-icon"),s(41,"search"),a(),o(42,"span",19),s(43,"Search"),a(),o(44,"span",20),s(45,"\u2318K"),a()(),o(46,"div",21)(47,"mat-icon",22),s(48,"account_circle"),a(),o(49,"span",23),s(50),a()(),o(51,"button",24),m("click",function(){return t.logout()}),o(52,"mat-icon"),s(53,"logout"),a()()(),o(54,"div",25),Q(55,"router-outlet"),a()()(),o(56,"button",26),m("click",function(){return t.openQuickExpense()}),o(57,"mat-icon"),s(58,"add"),a()(),_(59,mi,26,2,"nav",27),Q(60,"app-command-palette")),e&2&&(g(),B("mode",t.isMobile()?"over":"side")("opened",!t.isMobile())("fixedInViewport",t.isMobile()),g(9),b("expanded",t.expandedSections().includes("finance")),g(5),v(t.expandedSections().includes("finance")?15:-1),g(),b("expanded",t.expandedSections().includes("trading")),g(5),v(t.expandedSections().includes("trading")?21:-1),g(),b("expanded",t.expandedSections().includes("health")),g(5),v(t.expandedSections().includes("health")?27:-1),g(),v(t.isAdmin()?28:-1),g(3),v(t.isMobile()&&!t.isPhone()?31:-1),g(),v(t.isPhone()?32:-1),g(2),G(t.pageTitle()),g(2),L("aria-label","Switch theme"),g(2),G(t.themeIcon()),g(12),G(t.userEmail()),g(4),B("@routeAnimation",t.getRouteAnimationData()),g(5),v(t.isPhone()?59:-1))},dependencies:[Ce,At,Ot,bn,Ye,vn,Te,Cn,wn,sn,an,on,rn,nn,Se,ke,$t,Zt,qt,Kt,en,Xt,de],styles:[".shell-container[_ngcontent-%COMP%]{height:100vh}.sidenav[_ngcontent-%COMP%]{width:240px;background:var(--gradient-sidebar);-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);border-right:none}.sidenav-header[_ngcontent-%COMP%]{padding:20px 16px 12px}.brand[_ngcontent-%COMP%]{display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer;transition:opacity var(--transition-fast)}.brand[_ngcontent-%COMP%]:hover{opacity:.8}.brand-icon[_ngcontent-%COMP%]{color:var(--color-sidebar-accent);font-size:24px;width:24px;height:24px}.brand-name[_ngcontent-%COMP%]{font-family:var(--font-primary);font-size:1.125rem;font-weight:700;color:var(--color-sidebar-text-active);letter-spacing:-.03em}.nav-section-header[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-sidebar-text);opacity:.6;padding:16px 16px 8px;-webkit-user-select:none;user-select:none;cursor:pointer;transition:opacity .15s;min-height:40px}.nav-section-header[_ngcontent-%COMP%]:hover{opacity:.9}.nav-section-header[_ngcontent-%COMP%]:first-child{padding-top:6px}.section-label[_ngcontent-%COMP%]{flex:1}.section-chevron[_ngcontent-%COMP%]{font-size:18px;width:18px;height:18px;transition:transform .2s ease;transform:rotate(-90deg);opacity:.7}.nav-section-header.expanded[_ngcontent-%COMP%]   .section-chevron[_ngcontent-%COMP%]{transform:rotate(0)}.nav-section-items[_ngcontent-%COMP%]{animation:_ngcontent-%COMP%_slideDown .15s ease-out}@keyframes _ngcontent-%COMP%_slideDown{0%{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}.nav-list[_ngcontent-%COMP%]{padding:8px 10px}.nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{border-radius:var(--radius-sm)!important;margin-bottom:1px;font-family:var(--font-primary);font-size:var(--text-sm);font-weight:500;color:var(--color-sidebar-text)!important;transition:all var(--transition-fast);height:36px!important}.nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--color-sidebar-text)!important;font-size:20px;width:20px;height:20px}.nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{color:var(--color-sidebar-text)!important}.nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover{background-color:var(--color-sidebar-hover)!important}.nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover   mat-icon[_ngcontent-%COMP%], .nav-list[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover   span[_ngcontent-%COMP%]{color:var(--color-sidebar-text-active)!important}.nav-list[_ngcontent-%COMP%]   a.active-link[_ngcontent-%COMP%]{background-color:var(--color-sidebar-active)!important}.nav-list[_ngcontent-%COMP%]   a.active-link[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:var(--color-sidebar-accent)!important}.nav-list[_ngcontent-%COMP%]   a.active-link[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{color:var(--color-sidebar-text-active)!important}.app-toolbar[_ngcontent-%COMP%]{background:#ffffffb8!important;-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);color:var(--color-text)!important;border-bottom:none;box-shadow:none;height:56px;position:sticky;top:0;z-index:10}.dark[_nghost-%COMP%]   .app-toolbar[_ngcontent-%COMP%], .dark   [_nghost-%COMP%]   .app-toolbar[_ngcontent-%COMP%]{background:#1c1c1ed1!important}.dark[_nghost-%COMP%]   .bottom-tabs[_ngcontent-%COMP%], .dark   [_nghost-%COMP%]   .bottom-tabs[_ngcontent-%COMP%]{background:#1c1c1ee0;border-top-color:#ffffff0f}.theme-toggle[_ngcontent-%COMP%]{margin-right:4px}.toolbar-title[_ngcontent-%COMP%]{font-family:var(--font-primary);font-size:var(--text-lg);font-weight:600;margin-left:8px;letter-spacing:var(--tracking-tight)}.toolbar-spacer[_ngcontent-%COMP%]{flex:1 1 auto}.user-info[_ngcontent-%COMP%]{display:flex;align-items:center;gap:6px;margin-right:8px;padding:4px 12px 4px 8px;border-radius:var(--radius-full);background:var(--color-surface-secondary)}.user-avatar[_ngcontent-%COMP%]{font-size:22px;width:22px;height:22px;color:var(--color-primary)}.user-email[_ngcontent-%COMP%]{font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.content-area[_ngcontent-%COMP%]{position:relative;padding:24px 32px;min-height:calc(100vh - 56px)}@media(max-width:768px){.content-area[_ngcontent-%COMP%]{padding:var(--spacing-md)}.toolbar-title[_ngcontent-%COMP%]{font-size:var(--text-base)}.user-email[_ngcontent-%COMP%]{display:none}.user-info[_ngcontent-%COMP%]{padding:4px;background:none}.search-trigger[_ngcontent-%COMP%]   .search-hint[_ngcontent-%COMP%], .search-trigger[_ngcontent-%COMP%]   .search-kbd[_ngcontent-%COMP%]{display:none}.search-trigger[_ngcontent-%COMP%]{min-width:36px!important;padding:4px 8px!important;margin-right:4px}}.mobile-brand[_ngcontent-%COMP%]{display:none}@media(max-width:599px){.mobile-brand[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#007aff26,#5856d626);margin-right:10px;text-decoration:none;-webkit-tap-highlight-color:transparent}.mobile-brand-icon[_ngcontent-%COMP%]{font-size:22px!important;width:22px!important;height:22px!important;color:var(--color-primary)}.content-area[_ngcontent-%COMP%]{padding:20px 16px 100px}.app-toolbar[_ngcontent-%COMP%]{height:56px;padding:0 14px!important}.app-toolbar[_ngcontent-%COMP%]   button[mat-icon-button][_ngcontent-%COMP%]{width:44px;height:44px}.app-toolbar[_ngcontent-%COMP%]   button[mat-icon-button][_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:24px!important;width:24px!important;height:24px!important}.toolbar-title[_ngcontent-%COMP%]{font-size:1.2rem!important;font-weight:700!important}}.global-fab[_ngcontent-%COMP%]{position:fixed;bottom:32px;right:32px;z-index:100;width:56px!important;height:56px!important;background:linear-gradient(135deg,#007aff,#5856d6)!important;color:#fff!important;box-shadow:0 6px 20px #007aff66,var(--shadow-lg)!important;transition:transform var(--transition-fast),box-shadow var(--transition-fast)}.global-fab[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:28px!important;width:28px!important;height:28px!important}.global-fab[_ngcontent-%COMP%]:hover{transform:scale(1.08);box-shadow:0 8px 28px #007aff80,var(--shadow-xl)!important}.search-trigger[_ngcontent-%COMP%]{display:flex;align-items:center;gap:6px;padding:4px 12px!important;border-radius:var(--radius-full)!important;background:var(--color-surface-secondary)!important;color:var(--color-text-secondary)!important;font-size:var(--text-xs)!important;min-height:32px!important;margin-right:8px}.search-trigger[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:16px;width:16px;height:16px}.search-hint[_ngcontent-%COMP%]{font-weight:500}.search-kbd[_ngcontent-%COMP%]{font-size:.65rem;padding:1px 5px;border-radius:3px;background:var(--color-surface);border:1px solid var(--color-border)}.bottom-tabs[_ngcontent-%COMP%]{position:fixed;bottom:0;left:0;right:0;z-index:1000;display:flex;align-items:center;justify-content:space-around;height:72px;padding-bottom:env(safe-area-inset-bottom,0px);background:#ffffffe0;-webkit-backdrop-filter:blur(20px) saturate(180%);backdrop-filter:blur(20px) saturate(180%);border-top:.5px solid var(--color-border)}.tab-item[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;flex:1;padding:8px 0;text-decoration:none;color:var(--color-text-muted);border:none;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color var(--transition-fast)}.tab-item[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:28px;width:28px;height:28px}.tab-item[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{font-family:var(--font-primary);font-size:.8rem;font-weight:600;letter-spacing:.01em}.tab-item.tab-active[_ngcontent-%COMP%]{color:var(--color-primary)}@media(max-width:599px){.global-fab[_ngcontent-%COMP%]{bottom:calc(88px + env(safe-area-inset-bottom,0px));right:20px;width:56px!important;height:56px!important}.global-fab[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{font-size:26px!important;width:26px!important;height:26px!important}.content-area[_ngcontent-%COMP%]{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important}}"],data:{animation:[yn]}})};function pi(i,r){i&1&&Q(0,"app-nav-shell")}function hi(i,r){i&1&&Q(0,"router-outlet")}var Ie=class i{router=l(P);authService=l(j);swUpdate=l(qe);showShell=!1;ngOnInit(){this.router.events.pipe(E(r=>r instanceof we)).subscribe(r=>{this.showShell=!r.urlAfterRedirects.startsWith("/login")}),this.swUpdate.isEnabled&&(this.swUpdate.versionUpdates.subscribe(r=>{r.type==="VERSION_READY"&&document.location.reload()}),this.swUpdate.checkForUpdate())}static \u0275fac=function(e){return new(e||i)};static \u0275cmp=w({type:i,selectors:[["app-root"]],decls:2,vars:1,template:function(e,t){e&1&&_(0,pi,1,0,"app-nav-shell")(1,hi,1,0,"router-outlet"),e&2&&v(t.showShell?0:1)},dependencies:[Ce,Ne],styles:["[_nghost-%COMP%]{display:block;height:100vh}"]})};Et(Ie,_n).catch(i=>console.error(i));
