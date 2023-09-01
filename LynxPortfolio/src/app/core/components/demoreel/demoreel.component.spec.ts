import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoreelComponent } from './demoreel.component';

describe('DemoreelComponent', () => {
  let component: DemoreelComponent;
  let fixture: ComponentFixture<DemoreelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DemoreelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoreelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
