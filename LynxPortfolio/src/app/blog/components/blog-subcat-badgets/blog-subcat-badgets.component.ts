import { Component, Input } from '@angular/core';
/* Interfaces */
import { IArticleSubCat } from '../../interfaces/blog';
/* Services */
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';

@Component({
    selector: 'blog-subcat-badgets',
    templateUrl: './blog-subcat-badgets.component.html',
    styleUrls: ['./blog-subcat-badgets.component.scss'],
    standalone: false
})
export class BlogSubCatBadgetsComponent {
  @Input() subcats!: IArticleSubCat[];
  @Input() lang: string = 'es';
  constructor(private _befService: NgxBootstrapExpandedFeaturesService) {}
  cssCreate(): void {
    this._befService.cssCreate();
  }
}
