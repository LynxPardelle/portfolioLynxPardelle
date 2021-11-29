import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Main
import { InicioComponent } from './components/main/inicio/inicio.component';
import { ErrorComponent } from './components/main/error/error.component';

const routes: Routes = [
  { path: '', component: InicioComponent },

  // Main

  // Error
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
