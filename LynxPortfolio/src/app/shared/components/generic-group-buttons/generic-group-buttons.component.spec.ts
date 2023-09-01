import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericGroupButtonsComponent } from './generic-group-buttons.component';

describe('GenericGroupButtonsComponent', () => {
  let component: GenericGroupButtonsComponent;
  let fixture: ComponentFixture<GenericGroupButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenericGroupButtonsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericGroupButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
