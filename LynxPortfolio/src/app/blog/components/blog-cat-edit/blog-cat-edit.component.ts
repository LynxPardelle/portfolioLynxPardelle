import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
/* Interfaces */
import { IArticle, IArticleCat } from '../../interfaces/blog';
/* Services */
import { BlogService } from '../../services/blog.service';
/* Extras */
import Swal from 'sweetalert2';
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';
import { WebService } from 'src/app/shared/services/web.service';
@Component({
  selector: 'blog-cat-edit',
  templateUrl: './blog-cat-edit.component.html',
  styleUrls: ['./blog-cat-edit.component.scss'],
})
export class BlogCatEditComponent implements OnInit {
  // Models
  public cat: IArticleCat = {
    _id: '',
    title: '',
    titleEng: '',
    titleColor: '',
    textColor: '',
    textColor2: '',
    linkColor: '',
    linkColor2: '',
    bgColor: '',
    bgColor2: '',
    buttonColor: '',
    subcats: [],
    show: true,
    create_at: new Date(),
  };
  @Input() article!: IArticle;
  @Input() cats!: IArticleCat[];
  /* Outputs */
  @Output() getArticleCats = new EventEmitter<any>();
  @Output() catSelected = new EventEmitter<any>();
  constructor(
    private _blogService: BlogService,
    private _webService: WebService,
    private _befService: NgxBootstrapExpandedFeaturesService
  ) {}

  ngOnInit(): void {
    this.cssCreate();
  }

  onSubmitCatDelete(cat: IArticleCat) {
    Swal.fire({
      title: '¿Estas seguro?',
      text: '¡Una vez borrada la categoría, ya no se podrá recuperar!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ok',
      cancelButtonText: 'Cancel',
    }).then((willDelete) => {
      if (!!willDelete?.isConfirmed) {
        let catId = cat._id;
        this._webService.consoleLog(catId);
        this._blogService.deleteArticleCat(catId).subscribe({
          next: (r: any) => {
            this.getArticleCats.emit();
            //Alerta
            Swal.fire(
              'Categoría eliminada',
              'La categoría fue borrada con éxito',
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

  onSubmitCat(): void {
    console.log('cat', this.cat);
    if (
      this.cat.buttonColor == '' ||
      this.cat.titleColor == '' ||
      this.cat.title == ''
    ) {
      //Alerta
      Swal.fire(
        'Faltan datos',
        'Es necesario los colores de fondo y texto y el nombre de la categoría.',
        'error'
      );
    } else {
      if (this.cat._id) {
        this._blogService.updateArticleCat(this.cat).subscribe({
          next: (r: any) => {
            this._webService.consoleLog(r);
            if (r.articleCat) {
              this.cat = {
                _id: '',
                title: '',
                titleEng: '',
                titleColor: '',
                textColor: '',
                textColor2: '',
                linkColor: '',
                linkColor2: '',
                bgColor: '',
                bgColor2: '',
                buttonColor: '',
                subcats: [],
                show: true,
                create_at: new Date(),
              };
              //Alerta
              Swal.fire(
                'Categoría actualizada',
                'La categoría fue actualizada con éxito',
                'success'
              );
              this.getArticleCats.emit();
            }
          },
          error: (e: any) => {
            this._webService.consoleLog(e);
          },
        });
      } else {
        this._blogService.createArticleCat(this.cat).subscribe({
          next: (r: any) => {
            this._webService.consoleLog(r);
            if (r.articleCat) {
              this.cat = {
                _id: '',
                title: '',
                titleEng: '',
                titleColor: '',
                textColor: '',
                textColor2: '',
                linkColor: '',
                linkColor2: '',
                bgColor: '',
                bgColor2: '',
                buttonColor: '',
                subcats: [],
                show: true,
                create_at: new Date(),
              };
              //Alerta
              Swal.fire(
                'Categoría creada',
                'La categoría fue creada con éxito',
                'success'
              );
              this.getArticleCats.emit();
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
  onClickChangeCat(cat: any) {
    if (!this.article.cat !== cat) {
      this.article.cat = cat;
    } else {
      delete this.article.cat;
    }
    this.catSelected.emit();
  }

  catBringer(cat: string | IArticleCat, inverse: boolean = false): boolean {
    const sc = this.article.cat;
    return (
      (typeof cat !== 'string' && !!cat._id ? cat._id : cat.toString()) ===
      (typeof sc !== 'string' && !!sc._id ? sc._id : sc.toString())
    );
  }

  onClickCatUpdate(cat: any) {
    if (this.cat !== cat && !!cat) {
      this.cat = cat;
    } else {
      this.cat = {
        _id: '',
        title: '',
        titleEng: '',
        titleColor: '',
        textColor: '',
        textColor2: '',
        linkColor: '',
        linkColor2: '',
        bgColor: '',
        bgColor2: '',
        buttonColor: '',
        subcats: [],
        show: true,
        create_at: new Date(),
      };
    }
  }

  onClickButton(event: any) {
    switch (true) {
      case event.includes('edit┼cat┼') || event.includes('cancel┼cat┼'):
        let catE: IArticleCat = this.cats.find(
          (c) => c._id === event.split('┼')[2]
        ) as IArticleCat;
        this.onClickCatUpdate(catE);
        break;
      case event.includes('delete┼cat┼'):
        let catD: IArticleCat = this.cats.find(
          (c) => c._id === event.split('┼')[2]
        ) as IArticleCat;
        if (!!catD) {
          this.onSubmitCatDelete(catD);
        }
        break;
      case event === 'aceptCat':
        console.log('aceptCat');
        this.onSubmitCat();
        break;
      default:
        break;
    }
  }

  cssCreate(): void {
    this._befService.cssCreate();
  }

  befisize(str: string): string {
    return this._befService.befysize(str);
  }
}
