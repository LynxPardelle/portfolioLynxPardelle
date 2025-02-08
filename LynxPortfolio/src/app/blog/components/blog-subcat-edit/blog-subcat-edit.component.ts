import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
/* Interfaces */
import { IArticle, IArticleSubCat } from '../../interfaces/blog';
/* Services */
import { BlogService } from '../../services/blog.service';
/* Extras */
import Swal from 'sweetalert2';
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';
import { WebService } from 'src/app/shared/services/web.service';
@Component({
    selector: 'blog-subcat-edit',
    templateUrl: './blog-subcat-edit.component.html',
    styleUrls: ['./blog-subcat-edit.component.scss'],
    standalone: false
})
export class BlogSubcatEditComponent implements OnInit {
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
    private _webService: WebService,
    private _befService: NgxBootstrapExpandedFeaturesService
  ) {}

  ngOnInit(): void {
    this.cssCreate();
  }

  onSubmitSubCatDelete(cat: IArticleSubCat) {
    Swal.fire({
      title: '¿Estas seguro?',
      text: '¡Una vez borrada la sub-categoría, ya no se podrá recuperar!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ok',
      cancelButtonText: 'Cancel',
    }).then((willDelete) => {
      if (!!willDelete?.isConfirmed) {
        let catId = cat._id;
        this._webService.consoleLog(catId);
        this._blogService.deleteArticleSubCat(catId).subscribe({
          next: (r: any) => {
            this.getArticleSubCats.emit();
            //Alerta
            Swal.fire(
              'Sub-categoría eliminada',
              'La sub-categoría fue borrada con éxito',
              'success'
            );
          },
          error: (e: any) => {
            this._webService.consoleLog(e);
            //Alerta
            Swal.fire(
              'Error al eliminar',
              'Hubo un error al eliminar, favor de revisar la consola',
              'success'
            );
          },
        });
      } else {
        Swal.fire('Calma, nada se borró');
      }
    });
  }

  onSubmitSubCat(): void {
    this.subCat.cat = this.article.cat;
    if (
      this.subCat.buttonColor == '' ||
      this.subCat.titleColor == '' ||
      this.subCat.title == '' ||
      this.subCat.cat === ''
    ) {
      //Alerta
      Swal.fire(
        'Faltan datos',
        'Es necesario los colores de fondo y texto y el nombre de la sub-categoría.',
        'error'
      );
    } else {
      if (this.subCat._id) {
        this._blogService.updateArticleSubCat(this.subCat).subscribe({
          next: (r: any) => {
            this._webService.consoleLog(r);
            if (r.articleSubCat) {
              this.subCat = {
                _id: '',
                title: '',
                titleEng: '',
                titleColor: '',
                buttonColor: '',
                cat: '',
                show: true,
                create_at: new Date(),
              };
              //Alerta
              Swal.fire(
                'Sub-categoría actualizada',
                'La sub-categoría fue actualizada con éxito',
                'success'
              );
              this.getArticleSubCats.emit();
            }
          },
          error: (e: any) => {
            this._webService.consoleLog(e);
          },
        });
      } else {
        this._blogService.createArticleSubCat(this.subCat).subscribe({
          next: (r: any) => {
            this._webService.consoleLog(r);
            if (r.articleSubCat) {
              this.subCat = {
                _id: '',
                title: '',
                titleEng: '',
                titleColor: '',
                buttonColor: '',
                cat: '',
                show: true,
                create_at: new Date(),
              };
              //Alerta
              Swal.fire(
                'Sub-categoría creada',
                'La sub-categoría fue creada con éxito',
                'success'
              );
              this.getArticleSubCats.emit();
            }
          },
          error: (e: any) => {
            this._webService.consoleLog(e);
          },
        });
      }
    }
  }
  /* Utility */
  onClickChangeSubCat(subCat: any) {
    if (!this.article.subCats.includes(subCat)) {
      this.article.subCats.push(subCat);
    } else {
      let index = this.article.subCats.indexOf(subCat);

      if (index > -1) {
        this.article.subCats.splice(index, 1);
      }
    }
  }

  subCatBringer(
    subCat: string | IArticleSubCat,
    inverse: boolean = false
  ): IArticleSubCat | string {
    return this.article.subCats.find((sc: IArticleSubCat | string) => {
      return (
        (typeof subCat !== 'string' && !!subCat._id
          ? subCat._id
          : subCat.toString()) ===
        (typeof sc !== 'string' && !!sc._id ? sc._id : sc.toString())
      );
    });

    /* !inverse
      ? !!this.subCats.find(
          (subCat: IArticleSubCat) =>
            !!subCats.find((c: string | IArticleSubCat) =>
              typeof c !== 'string' && !!c._id
                ? c._id === subCat._id
                : subCat._id === c
            )
        )
      : !!this.article.subCats.find(
          (subCat: string | IArticleSubCat) =>
            !!subCats.find((c: string | IArticleSubCat) => {
              let aSC =
                typeof subCat !== 'string' && !!subCat._id
                  ? subCat._id
                  : subCat.toString();
              let sC = typeof c !== 'string' && !!c._id ? c._id : c.toString();
              return aSC === sC;
            })
        ); */
  }

  onClickSubCatUpdate(subCat: any) {
    if (this.subCat !== subCat && !!subCat) {
      this.subCat = subCat;
    } else {
      this.subCat = {
        _id: '',
        title: '',
        titleEng: '',
        titleColor: '',
        buttonColor: '',
        cat: '',
        show: true,
        create_at: new Date(),
      };
    }
  }

  onClickButton(event: any) {
    switch (true) {
      case event.includes('edit┼subCat┼') || event.includes('cancel┼subCat┼'):
        let subCatE: IArticleSubCat = this.subCats.find((c) =>
          typeof c !== 'string' && c._id
            ? c._id === event.split('┼')[2]
            : c === event.split('┼')[2]
        ) as IArticleSubCat;
        this.onClickSubCatUpdate(subCatE);
        break;
      case event.includes('delete┼subCat┼'):
        let subCatD: IArticleSubCat = this.subCats.find((c) =>
          typeof c !== 'string' && c._id
            ? c._id === event.split('┼')[2]
            : c === event.split('┼')[2]
        ) as IArticleSubCat;
        if (!!subCatD) {
          this.onSubmitSubCatDelete(subCatD);
        }
        break;
      case event === 'aceptCat':
        console.log('aceptCat');
        this.onSubmitSubCat();
        break;
      default:
        break;
    }
  }

  cssCreate(): void {
    console.log('cssCreate');
    this._befService.cssCreate();
  }
}
