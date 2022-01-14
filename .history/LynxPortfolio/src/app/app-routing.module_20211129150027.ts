import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/* Main */
import { InicioComponent } from './components/main/inicio/inicio.component';
import { ErrorComponent } from './components/main/error/error.component';
import { WebsitesComponent } from './components/websites/websites.component';
import { DemoreelComponent } from './components/demoreel/demoreel.component';
import { BookComponent } from './components/book/book.component';
import { MusicComponent } from './components/music/music.component';
import { CvComponent } from './components/cv/cv.component';
import { LoginComponent } from './components/login/login.component';

/* Blog */
import { BlogComponent } from './components/blog/blog/blog.component';
import { ArticleComponent } from './components/blog/article/article.component';

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
