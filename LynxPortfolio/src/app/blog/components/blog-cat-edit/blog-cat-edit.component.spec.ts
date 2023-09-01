import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogCatEditComponent } from './blog-cat-edit.component';

describe('BlogCatEditComponent', () => {
  let component: BlogCatEditComponent;
  let fixture: ComponentFixture<BlogCatEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlogCatEditComponent]
    });
    fixture = TestBed.createComponent(BlogCatEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
