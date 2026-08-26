import{a as X}from"./chunk-EZTS2TUH.js";import{a as W}from"./chunk-A5SZELON.js";import{m as q,n as Y,o as J}from"./chunk-TOMJSKOQ.js";import{I as G,J as K,U,V as R,x as Q}from"./chunk-CZVMAR5M.js";import{$b as h,Ea as V,Eb as b,Fb as m,Gb as d,Lb as p,Mb as _,Nb as v,Ob as u,Pb as P,Qb as j,Sc as L,Vc as M,Wb as y,Zb as N,aa as D,ab as s,ac as x,bc as c,ca as g,dc as z,ea as a,ec as F,fc as B,h as O,lc as k,nc as C,pb as f,pc as w,qb as T,sa as E,wc as H,xa as I,yb as A}from"./chunk-65WL2JVZ.js";var ot=["*",[["mat-option"],["ng-container"]]],at=["*","mat-option, ng-container"],rt=["text"],lt=[[["mat-icon"]],"*"],st=["mat-icon","*"];function ct(i,o){if(i&1&&u(0,"mat-pseudo-checkbox",1),i&2){let t=h();p("disabled",t.disabled)("state",t.selected?"checked":"unchecked")}}function mt(i,o){if(i&1&&u(0,"mat-pseudo-checkbox",3),i&2){let t=h();p("disabled",t.disabled)}}function dt(i,o){if(i&1&&(_(0,"span",4),C(1),v()),i&2){let t=h();s(),w("(",t.group.label,")")}}var Z=new g("MAT_OPTION_PARENT_COMPONENT"),$=new g("MatOptgroup"),Rt=(()=>{class i{label;disabled=!1;_labelId=a(R).getId("mat-optgroup-label-");_inert;constructor(){let t=a(Z,{optional:!0});this._inert=t?.inertGroups??!1}static \u0275fac=function(n){return new(n||i)};static \u0275cmp=f({type:i,selectors:[["mat-optgroup"]],hostAttrs:[1,"mat-mdc-optgroup"],hostVars:3,hostBindings:function(n,e){n&2&&b("role",e._inert?null:"group")("aria-disabled",e._inert?null:e.disabled.toString())("aria-labelledby",e._inert?null:e._labelId)},inputs:{label:"label",disabled:[2,"disabled","disabled",M]},exportAs:["matOptgroup"],features:[H([{provide:$,useExisting:i}])],ngContentSelectors:at,decls:5,vars:4,consts:[["role","presentation",1,"mat-mdc-optgroup-label",3,"id"],[1,"mdc-list-item__primary-text"]],template:function(n,e){n&1&&(x(ot),P(0,"span",0)(1,"span",1),C(2),c(3),j()(),c(4,1)),n&2&&(k("mdc-list-item--disabled",e.disabled),y("id",e._labelId),s(2),w("",e.label," "))},styles:[`.mat-mdc-optgroup {
  color: var(--mat-optgroup-label-text-color, var(--mat-sys-on-surface-variant));
  font-family: var(--mat-optgroup-label-text-font, var(--mat-sys-title-small-font));
  line-height: var(--mat-optgroup-label-text-line-height, var(--mat-sys-title-small-line-height));
  font-size: var(--mat-optgroup-label-text-size, var(--mat-sys-title-small-size));
  letter-spacing: var(--mat-optgroup-label-text-tracking, var(--mat-sys-title-small-tracking));
  font-weight: var(--mat-optgroup-label-text-weight, var(--mat-sys-title-small-weight));
}

.mat-mdc-optgroup-label {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  min-height: 48px;
  padding: 0 16px;
  outline: none;
}
.mat-mdc-optgroup-label.mdc-list-item--disabled {
  opacity: 0.38;
}
.mat-mdc-optgroup-label .mdc-list-item__primary-text {
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-family: inherit;
  text-decoration: inherit;
  text-transform: inherit;
  white-space: normal;
  color: inherit;
}
`],encapsulation:2,changeDetection:0})}return i})(),S=class{source;isUserInput;constructor(o,t=!1){this.source=o,this.isUserInput=t}},tt=(()=>{class i{_element=a(V);_changeDetectorRef=a(L);_parent=a(Z,{optional:!0});group=a($,{optional:!0});_signalDisableRipple=!1;_selected=!1;_active=!1;_mostRecentViewValue="";get multiple(){return this._parent&&this._parent.multiple}get selected(){return this._selected}value;id=a(R).getId("mat-option-");get disabled(){return this.group&&this.group.disabled||this._disabled()}set disabled(t){this._disabled.set(t)}_disabled=I(!1);get disableRipple(){return this._signalDisableRipple?this._parent.disableRipple():!!this._parent?.disableRipple}get hideSingleSelectionIndicator(){return!!(this._parent&&this._parent.hideSingleSelectionIndicator)}onSelectionChange=new E;_text;_stateChanges=new O;constructor(){let t=a(G);t.load(Y),t.load(K),this._signalDisableRipple=!!this._parent&&A(this._parent.disableRipple)}get active(){return this._active}get viewValue(){return(this._text?.nativeElement.textContent||"").trim()}select(t=!0){this._selected||(this._selected=!0,this._changeDetectorRef.markForCheck(),t&&this._emitSelectionChangeEvent())}deselect(t=!0){this._selected&&(this._selected=!1,this._changeDetectorRef.markForCheck(),t&&this._emitSelectionChangeEvent())}focus(t,n){let e=this._getHostElement();typeof e.focus=="function"&&e.focus(n)}setActiveStyles(){this._active||(this._active=!0,this._changeDetectorRef.markForCheck())}setInactiveStyles(){this._active&&(this._active=!1,this._changeDetectorRef.markForCheck())}getLabel(){return this.viewValue}_handleKeydown(t){(t.keyCode===13||t.keyCode===32)&&!U(t)&&(this._selectViaInteraction(),t.preventDefault())}_selectViaInteraction(){this.disabled||(this._selected=this.multiple?!this._selected:!0,this._changeDetectorRef.markForCheck(),this._emitSelectionChangeEvent(!0))}_getTabIndex(){return this.disabled?"-1":"0"}_getHostElement(){return this._element.nativeElement}ngAfterViewChecked(){if(this._selected){let t=this.viewValue;t!==this._mostRecentViewValue&&(this._mostRecentViewValue&&this._stateChanges.next(),this._mostRecentViewValue=t)}}ngOnDestroy(){this._stateChanges.complete()}_emitSelectionChangeEvent(t=!1){this.onSelectionChange.emit(new S(this,t))}static \u0275fac=function(n){return new(n||i)};static \u0275cmp=f({type:i,selectors:[["mat-option"]],viewQuery:function(n,e){if(n&1&&z(rt,7),n&2){let r;F(r=B())&&(e._text=r.first)}},hostAttrs:["role","option",1,"mat-mdc-option","mdc-list-item"],hostVars:11,hostBindings:function(n,e){n&1&&N("click",function(){return e._selectViaInteraction()})("keydown",function(l){return e._handleKeydown(l)}),n&2&&(y("id",e.id),b("aria-selected",e.selected)("aria-disabled",e.disabled.toString()),k("mdc-list-item--selected",e.selected)("mat-mdc-option-multiple",e.multiple)("mat-mdc-option-active",e.active)("mdc-list-item--disabled",e.disabled))},inputs:{value:"value",id:"id",disabled:[2,"disabled","disabled",M]},outputs:{onSelectionChange:"onSelectionChange"},exportAs:["matOption"],ngContentSelectors:st,decls:8,vars:5,consts:[["text",""],["aria-hidden","true",1,"mat-mdc-option-pseudo-checkbox",3,"disabled","state"],[1,"mdc-list-item__primary-text"],["state","checked","aria-hidden","true","appearance","minimal",1,"mat-mdc-option-pseudo-checkbox",3,"disabled"],[1,"cdk-visually-hidden"],["aria-hidden","true","mat-ripple","",1,"mat-mdc-option-ripple","mat-focus-indicator",3,"matRippleTrigger","matRippleDisabled"]],template:function(n,e){n&1&&(x(lt),m(0,ct,1,2,"mat-pseudo-checkbox",1),c(1),_(2,"span",2,0),c(4,1),v(),m(5,mt,1,1,"mat-pseudo-checkbox",3),m(6,dt,2,1,"span",4),u(7,"div",5)),n&2&&(d(e.multiple?0:-1),s(5),d(!e.multiple&&e.selected&&!e.hideSingleSelectionIndicator?5:-1),s(),d(e.group&&e.group._inert?6:-1),s(),p("matRippleTrigger",e._getHostElement())("matRippleDisabled",e.disabled||e.disableRipple))},dependencies:[W,q],styles:[`.mat-mdc-option {
  -webkit-user-select: none;
  user-select: none;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  display: flex;
  position: relative;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  min-height: 48px;
  padding: 0 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  color: var(--mat-option-label-text-color, var(--mat-sys-on-surface));
  font-family: var(--mat-option-label-text-font, var(--mat-sys-label-large-font));
  line-height: var(--mat-option-label-text-line-height, var(--mat-sys-label-large-line-height));
  font-size: var(--mat-option-label-text-size, var(--mat-sys-body-large-size));
  letter-spacing: var(--mat-option-label-text-tracking, var(--mat-sys-label-large-tracking));
  font-weight: var(--mat-option-label-text-weight, var(--mat-sys-body-large-weight));
}
.mat-mdc-option:hover:not(.mdc-list-item--disabled) {
  background-color: var(--mat-option-hover-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%), transparent));
}
.mat-mdc-option:focus.mdc-list-item, .mat-mdc-option.mat-mdc-option-active.mdc-list-item {
  background-color: var(--mat-option-focus-state-layer-color, color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-focus-state-layer-opacity) * 100%), transparent));
  outline: 0;
}
.mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) {
  background-color: var(--mat-option-selected-state-layer-color, var(--mat-sys-secondary-container));
}
.mat-mdc-option.mdc-list-item--selected:not(.mdc-list-item--disabled):not(.mat-mdc-option-active, .mat-mdc-option-multiple, :focus, :hover) .mdc-list-item__primary-text {
  color: var(--mat-option-selected-state-label-text-color, var(--mat-sys-on-secondary-container));
}
.mat-mdc-option .mat-pseudo-checkbox {
  --mat-pseudo-checkbox-minimal-selected-checkmark-color: var(--mat-option-selected-state-label-text-color, var(--mat-sys-on-secondary-container));
}
.mat-mdc-option.mdc-list-item {
  align-items: center;
  background: transparent;
}
.mat-mdc-option.mdc-list-item--disabled {
  cursor: default;
  pointer-events: none;
}
.mat-mdc-option.mdc-list-item--disabled .mat-mdc-option-pseudo-checkbox, .mat-mdc-option.mdc-list-item--disabled .mdc-list-item__primary-text, .mat-mdc-option.mdc-list-item--disabled > mat-icon {
  opacity: 0.38;
}
.mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {
  padding-left: 32px;
}
[dir=rtl] .mat-mdc-optgroup .mat-mdc-option:not(.mat-mdc-option-multiple) {
  padding-left: 16px;
  padding-right: 32px;
}
.mat-mdc-option .mat-icon,
.mat-mdc-option .mat-pseudo-checkbox-full {
  margin-right: 16px;
  flex-shrink: 0;
}
[dir=rtl] .mat-mdc-option .mat-icon,
[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-full {
  margin-right: 0;
  margin-left: 16px;
}
.mat-mdc-option .mat-pseudo-checkbox-minimal {
  margin-left: 16px;
  flex-shrink: 0;
}
[dir=rtl] .mat-mdc-option .mat-pseudo-checkbox-minimal {
  margin-right: 16px;
  margin-left: 0;
}
.mat-mdc-option .mat-mdc-option-ripple {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}
.mat-mdc-option .mdc-list-item__primary-text {
  white-space: normal;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-family: inherit;
  text-decoration: inherit;
  text-transform: inherit;
  margin-right: auto;
}
[dir=rtl] .mat-mdc-option .mdc-list-item__primary-text {
  margin-right: 0;
  margin-left: auto;
}
@media (forced-colors: active) {
  .mat-mdc-option.mdc-list-item--selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    width: 10px;
    height: 0;
    border-bottom: solid 10px;
    border-radius: 10px;
  }
  [dir=rtl] .mat-mdc-option.mdc-list-item--selected:not(:has(.mat-mdc-option-pseudo-checkbox))::after {
    right: auto;
    left: 16px;
  }
}

.mat-mdc-option-multiple {
  --mat-list-list-item-selected-container-color: var(--mat-list-list-item-container-color, transparent);
}

.mat-mdc-option-active .mat-focus-indicator::before {
  content: "";
}
`],encapsulation:2,changeDetection:0})}return i})();function St(i,o,t){if(t.length){let n=o.toArray(),e=t.toArray(),r=0;for(let l=0;l<i+1;l++)n[l].group&&n[l].group===e[r]&&r++;return r}return 0}function Ot(i,o,t,n){return i<t?i:i+o>t+n?Math.max(0,i-n+o):t}var Pt=(()=>{class i{static \u0275fac=function(n){return new(n||i)};static \u0275mod=T({type:i});static \u0275inj=D({imports:[J,X,tt,Q]})}return i})();export{Z as a,$ as b,Rt as c,S as d,tt as e,St as f,Ot as g,Pt as h};
