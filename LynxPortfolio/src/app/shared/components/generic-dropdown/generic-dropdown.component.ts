import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
/* Interfaces */
import { IOptionDropdown } from '../../interfaces/optionDropdown';
/* Services */
import { SharedService } from '../../services/shared.service';
/* Pipes */
import { HarshifyPipe } from '../../pipes/harshify.pipe';
/* NGX-BEF */
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';
import { WebService } from '../../services/web.service';
@Component({
  selector: 'generic-dropdown',
  templateUrl: './generic-dropdown.component.html',
  styleUrls: ['./generic-dropdown.component.scss'],
  providers: [HarshifyPipe],
})
export class GenericDropdownComponent implements OnInit {
  public buttonId: string = '';
  public dropdownId: string = '';
  /* Input */
  @Input() labelTitle: string = '';
  @Input() placeholder: string[] | string | number = '';
  @Input() labelClasses: string = '';
  @Input() listClasses: string = '';
  @Input() buttonClasses: string =
    'bef-btn-white bef-fs-10px bef-text-btnBG bef-p-10px bef-rounded-10px';
  @Input() disabledClassButton: string = '';
  @Input() options: IOptionDropdown[] = [];
  @Input() disabled: boolean = false;
  @Input() withSearcher: boolean = false;
  @Input() multiselect: boolean = false;
  @Input() dropdownOpen: boolean = false;

  public searcher: any = { search: '' };
  public splitter: string = /* String.fromCharCode(219) */ ',';
  public splitterRegEx: RegExp = new RegExp(this.splitter, 'g');

  public pillsColors: string[] = [];
  /* Output */
  @Output() clickedTitle = new EventEmitter<string | number | string[]>();
  @Output() clicked = new EventEmitter<IOptionDropdown>();

  @Output() changesInput = new EventEmitter<any>();
  @Output() buttonIdEmit = new EventEmitter<string>();
  @Output() dropdownIdEmit = new EventEmitter<string>();
  constructor(
    private _sharedService: SharedService,
    private _webService: WebService,
    private _befService: NgxBootstrapExpandedFeaturesService,
    private _harshifyPipe: HarshifyPipe
  ) {}
  ngOnInit(): void {
    this.buttonId = this._harshifyPipe.transform(9, 'letters');
    this.buttonIdEmit.emit(this.buttonId);
    this.dropdownId = this._harshifyPipe.transform(9, 'letters');
    this.dropdownIdEmit.emit(this.dropdownId);
    this.searcher.search = '';
    this.cssCreate();
  }

  getOptions(): IOptionDropdown[] {
    if (!!this.withSearcher) {
      let searchRegex = new RegExp(this.searcher.search, 'gi');
      return this.options.filter((o: IOptionDropdown) => {
        return o.option.match(searchRegex);
      });
    } else {
      return this.options;
    }
  }

  InputReacher(event: any) {
    this.changesInput.emit(event);
  }

  onClicked(event: IOptionDropdown) {
    setTimeout(() => {
      this.searcher.search = '';
    }, 100);
    if (!!this.multiselect) {
      if (this.placeholder !== '' && typeof this.placeholder === 'string') {
        let placeholderSplit = this.placeholder.split(this.splitter);
        if (placeholderSplit.includes(event.option)) {
          let i = placeholderSplit.indexOf(event.option);
          placeholderSplit.splice(i, 1);
        } else {
          placeholderSplit.push(event.option);
        }
        this.placeholder = placeholderSplit.join(this.splitter);
      } else if (typeof this.placeholder === 'object') {
        if (!this.placeholder.includes(event.option)) {
          this.placeholder.push(event.option);
        } else {
          this.placeholder = this.placeholder.filter(
            (o: string) => o !== event.option
          );
        }
      } else {
        this.placeholder = event.option;
      }
      let newEvent: IOptionDropdown = {
        type: 'menuitemMultiselect',
        option: event.option,
        click: event.click,
      };
      if (typeof this.placeholder === 'string') {
        newEvent.option = event.option.replace(event.option, this.placeholder);
      } else if (typeof this.placeholder === 'object') {
        newEvent.option = this.placeholder.toString();
      }
      this._webService.consoleLog(this.placeholder);
      this.clicked.emit(newEvent);
      this.cssCreate();
    } else {
      this.clicked.emit(event);
    }
  }

  getRandomColor(i: number, last: boolean): string {
    let colors: string[] = this._befService.getColorsNames();
    while (
      this.pillsColors.length === 0 ||
      (!last ? i : i + 1) > this.pillsColors.length
    ) {
      this.pillsColors.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    return this.pillsColors[i];
  }

  checkElementWidth(elementId: string): number {
    return this._sharedService.checkElementProperty(elementId, 'clientWidth');
  }

  cssCreate() {
    this._befService.cssCreate();
  }
}
