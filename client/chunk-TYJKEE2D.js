import{h as G,j as K}from"./chunk-2HU45SOS.js";import{Gb as P,Hb as D,J as p,Kb as q,Lb as O,Mb as U,Nb as Y,O as f,Ob as J,P as h,Pa as W,Pb as z,Ra as F,_ as u,aa as l,ba as E,ca as g,d as $,da as b,db as R,e as I,ea as w,fb as V,ha as s,hb as x,ia as n,ic as H,jb as A,kb as T,ma as _,na as j,nb as ee,oa as N,sa as S,ta as m,wa as y,xa as C,ya as v,zb as B}from"./chunk-XXYOSJJU.js";var M=$(ee());function te(e,k){e&1&&(s(0,"span",11),m(1," El correo electr\xF3nico es obligatorio. "),n())}function ie(e,k){e&1&&(s(0,"span",11),m(1," La contrase\xF1a es obligatoria. "),n())}function oe(e,k){if(e&1){let t=_();s(0,"button",12),j("click",function(){f(t);let o=N();return h(o.onSubmit())}),m(1," Login "),n()}}var X=(()=>{class e{constructor(t,i,o,c,d,r,L){this._mainService=t,this._route=i,this._router=o,this._webService=c,this._befService=d,this._sharedService=r,this.store=L,this.user=new G("","","",""),this.document="login.component.ts",this.customConsoleCSS="background-color: rgba(123,45,100,0.75); color: white; padding: 1em;",this.windowWidth=window.innerWidth,r.changeEmitted$.subscribe(a=>{if(typeof a=="object"&&a.from!=="login"&&(a.to==="login"||a.to==="all"))switch(a.property){case"identity":this.identity=a.thing;break;case"windowWidth":this.windowWidth=a.thing;break;case"onlyConsoleMessage":this._webService.consoleLog(a.thing,this.document+" 51",this.customConsoleCSS);break}}),this.main$=L.select(P),this.identity=this._mainService.getIdentity(),this._webService.consoleLog(this.identity,this.document+" 60",this.customConsoleCSS),this._sharedService.emitChange({from:"app",to:"all",property:"identity",thing:this.identity}),this.store.dispatch(D())}ngOnInit(){this._sharedService.emitChange({from:"login",to:"all",property:"onlyConsoleMessage",thing:"Data from login"}),this.getMain()}getMain(){this.main$.subscribe({next:t=>{t!==void 0&&(this.main=t,this.cssCreate())},error:t=>console.error(t)})}onSubmit(){return I(this,null,function*(){try{let t=yield this._mainService.login(this.user).toPromise();if(!t||!t.user)throw new Error("No se encontr\xF3 el usuario.");let i=yield this._mainService.login(this.user,!0).toPromise();if(!i||!i.token)throw new Error("No se pudo conseguir el token.");this.identity=t.user,this.store.dispatch(K({sesion:{active:!0,identity:this.identity}})),this._webService.consoleLog(this.identity,this.document+" 57",this.customConsoleCSS),this.token=i.token,this._webService.consoleLog(this.token,this.document+" 63",this.customConsoleCSS),localStorage.setItem("ILP",JSON.stringify(this.identity)),this._sharedService.emitChange({from:"login",to:"all",property:"identity",thing:this.identity}),localStorage.setItem("TLP",this.token),this._router.navigate(["/inicio"]),M.default.fire({title:"Usuario logueado correctamente",html:"El usuario se ha identificado correctamente.",icon:"success",customClass:{popup:"bef bef-bg-fullRed",title:"text-bg-whatsApp",closeButton:"bg-whatsApp",confirmButton:"bg-whatsApp"}})}catch(t){this._webService.consoleLog(t,this.document+" 59",this.customConsoleCSS),M.default.fire({title:"Usuario no logueado",html:"El usuario no se ha logueado correctamente. <br/> "+t.error.message,icon:"error",customClass:{popup:"bef bef-bg-fullRed",title:"text-titleM",closeButton:"bef bef-text-fullYellow",confirmButton:"bef bef-text-fullYellow"}})}})}cssCreate(){this._befService.cssCreate()}static{this.\u0275fac=function(i){return new(i||e)(l(A),l(R),l(V),l(T),l(q),l(O),l(B))}}static{this.\u0275cmp=E({type:e,selectors:[["app-login"]],standalone:!1,decls:16,vars:5,consts:[["email","ngModel"],["password","ngModel"],[1,"w-75","bef","bef-wmx-350px","bef-wmn-275px","mx-auto","my-5","bef-boxShadow-0__0__5px__tdark__OPA__0_25","bef-rounded-30px","p-3"],[1,"text-center","bef","bef-text-tlight","my-3"],[1,"d-block","w-75","mx-auto","my-3"],["for","email",1,"bef","bef-text-tlight","mb-1","d-block"],["type","email","name","email","placeholder","Correo electr\xF3nico","required","",1,"w-100","bef","bef-text-tdark","bef-bg-tlight","bef-border-0",3,"ngModelChange","ngModel"],["class","bef bef-text-tlight font-weight-bold",4,"ngIf"],["for","password",1,"bef","bef-text-tlight","mb-1","d-block"],["type","password","name","password","placeholder","Contrase\xF1a","required","",1,"w-100","bef","bef-text-tdark","bef-bg-tlight","bef-border-0",3,"ngModelChange","ngModel"],["class","btn bef bef-btn-fullRed bef-text-tdark p-2 mx-auto my-5 d-block w-50",3,"click",4,"ngIf"],[1,"bef","bef-text-tlight","font-weight-bold"],[1,"btn","bef","bef-btn-fullRed","bef-text-tdark","p-2","mx-auto","my-5","d-block","w-50",3,"click"]],template:function(i,o){if(i&1){let c=_();s(0,"div",2)(1,"h2",3),m(2,"Login"),n(),s(3,"div",4)(4,"label",5),m(5,"Correo electr\xF3nico"),n(),s(6,"input",6,0),v("ngModelChange",function(r){return f(c),C(o.user.email,r)||(o.user.email=r),h(r)}),n(),b(8,te,2,0,"span",7),n(),s(9,"div",4)(10,"label",8),m(11,"Contrase\xF1a"),n(),s(12,"input",9,1),v("ngModelChange",function(r){return f(c),C(o.user.password,r)||(o.user.password=r),h(r)}),n(),b(14,ie,2,0,"span",7),n(),b(15,oe,2,0,"button",10),n()}if(i&2){let c=S(7),d=S(13);u(6),y("ngModel",o.user.email),u(2),w("ngIf",!c.valid&&c.touched),u(4),y("ngModel",o.user.password),u(2),w("ngIf",!d.valid&&d.touched),u(),w("ngIf",o.user.password.length>0&&o.user.email.length>0)}},dependencies:[W,U,Y,z,J],encapsulation:2})}}return e})();var ne=[{path:"",component:X}],Z=(()=>{class e{static{this.\u0275fac=function(i){return new(i||e)}}static{this.\u0275mod=g({type:e})}static{this.\u0275inj=p({imports:[x.forChild(ne),x]})}}return e})();var Le=(()=>{class e{static{this.\u0275fac=function(i){return new(i||e)}}static{this.\u0275mod=g({type:e})}static{this.\u0275inj=p({imports:[F,Z,H]})}}return e})();export{Le as AuthModule};
