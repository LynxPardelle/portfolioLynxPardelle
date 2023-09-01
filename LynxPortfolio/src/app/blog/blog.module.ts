import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogRoutingModule } from './blog-routing.module';
/* Modules */
import { SharedModule } from '../shared/shared.module';
/* Components */
import { BlogComponent } from './components/blog/blog.component';
import { ArticleComponent } from './components/article/article.component';
@NgModule({
  declarations: [BlogComponent, ArticleComponent],
  imports: [CommonModule, BlogRoutingModule, SharedModule],
  exports: [BlogComponent, ArticleComponent],
})
export class BlogModule {}
