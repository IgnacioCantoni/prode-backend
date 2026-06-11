import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mispredicciones } from './mispredicciones';

describe('Mispredicciones', () => {
  let component: Mispredicciones;
  let fixture: ComponentFixture<Mispredicciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mispredicciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Mispredicciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
