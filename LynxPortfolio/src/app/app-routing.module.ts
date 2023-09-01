import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
/* Components */
import { InicioComponent } from './core/components/inicio/inicio.component';
import { WebsitesComponent } from './core/components/websites/websites.component';
import { DemoreelComponent } from './core/components/demoreel/demoreel.component';
import { BookComponent } from './core/components/book/book.component';
import { MusicComponent } from './core/components/music/music.component';
import { CvComponent } from './core/components/cv/cv.component';
import { ErrorComponent } from './core/components/error/error.component';
const routes: Routes = [
  { path: '', component: InicioComponent },
  /* Core */
  { path: 'inicio', component: InicioComponent },
  { path: 'webs', component: WebsitesComponent },
  { path: 'reel', component: DemoreelComponent },
  { path: 'book', component: BookComponent },
  { path: 'music', component: MusicComponent },
  { path: 'cv', component: CvComponent },
  /* Blog */
  {
    path: 'blog',
    loadChildren: () => import('./blog/blog.module').then((m) => m.BlogModule),
  },
  /* Auth */
  {
    path: 'login',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  /* Error */
  { path: '**', component: ErrorComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
