import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogRoutingModule } from './blog-routing.module';
/* Modules */
import { SharedModule } from '../shared/shared.module';
/* Components */
import { BlogComponent } from './components/blog/blog.component';
import { ArticleComponent } from './components/article/article.component';
import { BlogCatBadgetsComponent } from './components/blog-cat-badgets/blog-cat-badgets.component';
import { BlogSubCatBadgetsComponent } from './components/blog-subcat-badgets/blog-subcat-badgets.component';
import { BlogCatEditComponent } from './components/blog-cat-edit/blog-cat-edit.component';
import { BlogSubcatEditComponent } from './components/blog-subcat-edit/blog-subcat-edit.component';
@NgModule({
  declarations: [
    BlogComponent,
    ArticleComponent,
    BlogCatBadgetsComponent,
    BlogSubCatBadgetsComponent,
    BlogCatEditComponent,
    BlogSubcatEditComponent,
  ],
  imports: [CommonModule, BlogRoutingModule, SharedModule],
  exports: [
    BlogComponent,
    ArticleComponent,
    BlogCatBadgetsComponent,
    BlogSubCatBadgetsComponent,
  ],
})
export class BlogModule {}
