import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
/* Blog */
import { BlogComponent } from './components/blog/blog.component';
import { ArticleComponent } from './components/article/article.component';
const routes: Routes = [
  { path: '', component: BlogComponent },
  { path: 'article', component: ArticleComponent },
  { path: 'article/:id', component: ArticleComponent },
  { path: ':page', component: BlogComponent },
  { path: 'list-cat/:cat', component: BlogComponent },
  { path: 'list-cat/:cat/:page', component: BlogComponent },
  { path: 'list-subcat/:subcat', component: BlogComponent },
  { path: 'list-subcat/:subcat/:page', component: BlogComponent },
  { path: 'search/:search', component: BlogComponent },
  { path: 'search/:search/:page', component: BlogComponent },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BlogRoutingModule {}
