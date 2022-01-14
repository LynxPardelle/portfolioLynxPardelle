import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/* Main */
import { InicioComponent } from './components/main/inicio/inicio.component';
import { WebsitesComponent } from './components/websites/websites.component';
import { DemoreelComponent } from './components/demoreel/demoreel.component';
import { BookComponent } from './components/book/book.component';
import { MusicComponent } from './components/music/music.component';
import { CvComponent } from './components/cv/cv.component';
import { LoginComponent } from './components/login/login.component';
import { ErrorComponent } from './components/main/error/error.component';

/* Blog */
import { BlogComponent } from './components/blog/blog/blog.component';
import { ArticleComponent } from './components/blog/article/article.component';

const routes: Routes = [
  { path: '', component: InicioComponent },

  // Main
  { path: '/webs', component: WebsitesComponent },
  { path: '/reel', component: DemoreelComponent },
  { path: '/book', component: BookComponent },
  { path: '/music', component: MusicComponent },
  { path: '/cv', component: CvComponent },
  { path: '/login', component: LoginComponent },

  // Blog
  { path: '/blog', component: BlogComponent },
  { path: '/blog/:page', component: BlogComponent },
  { path: '/blog/:cat', component: BlogComponent },
  { path: '/blog/:cat/:page', component: BlogComponent },
  { path: '/blog/:subcat', component: BlogComponent },
  { path: '/blog/:subcat/:page', component: BlogComponent },
  { path: '/article', component: ArticleComponent },
  { path: '/article/:id', component: ArticleComponent },

  // Error
  { path: '**', component: ErrorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
