import { Component, Input, Output, EventEmitter } from '@angular/core';
/* Interfaces */
import { IArticle, IArticleSubCat } from '../../interfaces/blog';
/* Services */
import { BlogService } from '../../services/blog.service';
/* Extras */
import Swal from 'sweetalert2';
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';
@Component({
  selector: 'app-blog-subcat-edit',
  templateUrl: './blog-subcat-edit.component.html',
  styleUrls: ['./blog-subcat-edit.component.scss'],
})
export class BlogSubcatEditComponent {
  // Models
  public subCat: IArticleSubCat = {
    _id: '',
    title: '',
    titleEng: '',
    titleColor: '',
    buttonColor: '',
    cat: '',
    show: true,
    create_at: new Date(),
  };
  @Input() article!: IArticle;
  @Input() subCats!: IArticleSubCat[];
  /* Outputs */
  @Output() getArticleSubCats = new EventEmitter<any>();
  constructor(
    private _blogService: BlogService,
    private _befService: NgxBootstrapExpandedFeaturesService
  ) {}

  cssCreate(): void {
    this._befService.cssCreate();
  }
}
