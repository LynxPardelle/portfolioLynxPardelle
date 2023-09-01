import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
/* Interfaces */
import { ISpanInput } from '../../interfaces/spanInput';
import { IOptionDropdown } from '../../interfaces/optionDropdown';
import { IButton } from '../../interfaces/button';
/* Services */
import { SharedService } from '../../services/shared.service';
import { NgxBootstrapExpandedFeaturesService } from 'ngx-bootstrap-expanded-features';
@Component({
  selector: 'generic-input',
  templateUrl: './generic-input.component.html',
  styleUrls: ['./generic-input.component.scss'],
})
export class GenericInputComponent implements OnInit {
  @Input() hasBeenTouched: boolean = false;
  @Input() labelTitle: string = '';
  @Input() placeholder: any;
  @Input() thingFather: any;
  @Input() thing!: string;
  @Input() type!: string;
  @Input() spans: ISpanInput[] = [];
  @Input() disabled: boolean = false;
  @Input() inputClasses: string = 'w-100 bg-transparent border-0 mt-2 ';
  @Input() inputDisabledClasses: string = 'w-100 bg-transparent border-0 mt-2 ';
  @Input() labelClasses: string = 'd-block text-start';
  @Input() inputContainerClasses: string =
    'd-flex bef bef-w-200px align-items-center';
  @Input() buttonClasses: string = '';
  @Input() listClasses: string = '';
  @Input() disabledClassButton: string = '';
  @Input() options: IOptionDropdown[] = [];
  @Input() readonly: boolean = false;
  @Input() readonlyClasses: string = '';
  @Input() hrClasses: string = '';
  @Input() inputMaskActive: boolean = false;
  @Input() buttons: IButton[] | undefined;
  @Input() ignoreLocked: boolean = false;
  @Input() hrActive: boolean = true;
  /* Output */
  @Output() changesInput = new EventEmitter<any>();
  @Output() clickedTitle = new EventEmitter<string | number | string[]>();
  @Output() clicked = new EventEmitter<IOptionDropdown>();
  constructor(private _befService: NgxBootstrapExpandedFeaturesService) {}
  ngOnInit(): void {
    this.cssCreate();
  }
  writtingInInput(event: any) {
    this.hasBeenTouched = true;
    this.thingFather.locked = !this.spans.every((s) => {
      return !this.evalThing(s.evalThing);
    });
    this.changesInput.emit(this.thingFather);
  }
  evalThing(evalThing: string): boolean {
    if (this.hasBeenTouched === true) {
      switch (true) {
        case evalThing === 'required':
          return this.thingFather[this.thing]?.length <= 0;
          break;
        case evalThing.includes('!validRegEx'):
          let newRegexN = new RegExp(evalThing.replace('!validRegEx', ''));
          return !newRegexN.test(this.thingFather[this.thing]);
          break;
        case evalThing.includes('validRegEx'):
          let newRegex = new RegExp(evalThing.replace('validRegEx', ''));
          return !newRegex.test(this.thingFather[this.thing]);
          break;
        case evalThing.includes('equal'):
          return (
            evalThing.replace('equal', '') !== this.thingFather[this.thing]
          );
          break;
        case evalThing.includes('not-equal'):
          return (
            evalThing.replace('not-equal', '') === this.thingFather[this.thing]
          );
          break;
        case evalThing.includes('numberMin'):
          return (
            parseInt(this.thingFather[this.thing]) <
            parseInt(evalThing.replace('numberMin', ''))
          );
          break;
        case evalThing.includes('min'):
          return (
            this.thingFather[this.thing].length <
            parseInt(evalThing.replace('min', ''))
          );
          break;
        case evalThing.includes('numberMax'):
          return (
            parseInt(this.thingFather[this.thing]) >
            parseInt(evalThing.replace('numberMax', ''))
          );
          break;
        case evalThing.includes('max'):
          return (
            this.thingFather[this.thing].length >
            parseInt(evalThing.replace('max', ''))
          );
          break;
        case evalThing === 'email':
          let emailRegex = new RegExp(
            '^[a-z0-9._%+-]+@[a-z0-9.-]{2,}(.[a-z]{2,4})+$'
          );
          return !emailRegex.test(this.thingFather[this.thing]);
          break;
        case evalThing === 'URI':
          let URIPermitedStringRegex = new RegExp(
            // Create a regex to check if the URI is valid
            // Only letters, numbers, - and _
            '^[a-zA-Z0-9-_]+$',
            'g'
          );
          return !URIPermitedStringRegex.test(this.thingFather[this.thing]);
          break;
        case evalThing === 'password':
          let passwordRegex = new RegExp(
            // Create a regex to check if the password is valid
            // At least one digit, one lowercase, one uppercase letter and one special character
            // Minimum eight in length
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*"/(///)/=¡?\'\\)])(?=.{8,})'
          );
          return !passwordRegex.test(this.thingFather[this.thing]);
          break;
        default:
          return !!eval(evalThing);
          break;
      }
    } else {
      return false;
    }
  }

  getClasses(newClass: string): any {
    let newClasses: any = {};
    for (let nClass of newClass.split(' ')) {
      newClasses[nClass.toString()] = true;
    }
    this.cssCreate();
    return newClasses;
  }
  changeValue(value: any) {
    this.thingFather[this.thing.toString()] = value;
    this.changesInput.emit(this.thingFather);
    setTimeout(() => {
      this.cssCreate();
    }, 10);
  }
  getRequired(): boolean {
    return (
      !this.spans ||
      this.spans.some((s) => {
        return s.evalThing.includes('required');
      })
    );
  }
  cssCreate() {
    this._befService.cssCreate();
  }
}
