import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import * as fileSaver from 'file-saver';

import { BanListCreatorComponent } from './ban-list-creator.component';
import { BanList } from './interface/banlist.interface';
import { CardAmount } from './interface/card-amount.interface';
import { Card } from './interface/card.interface';

describe('BanListCreatorComponent', () => {
  let component: BanListCreatorComponent;
  let fixture: ComponentFixture<BanListCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BanListCreatorComponent ],
      imports: [MatSnackBarModule, MatDialogModule, BrowserAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BanListCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('uploadBanList', () => {
    it('should handle no files', () => {
      const openSpy = spyOn(component['snackBar'], 'open').and.callThrough();
      const event = { target: { files: null } };
      component.uploadBanList(event as any);
      expect(openSpy).toHaveBeenCalledWith('Please select a file.', 'OK', { duration: 5000 });
    });

    it('should handle no file length', () => {
      const openSpy = spyOn(component['snackBar'], 'open').and.callThrough();
      const event = { target: { files: [] } };
      component.uploadBanList(event as any);
      expect(openSpy).toHaveBeenCalledWith('Please select a file.', 'OK', { duration: 5000 });
    });

    it('should handle files', () => {
      const openSpy = spyOn(component['snackBar'], 'open').and.callThrough();
      const event = { target: { files: [ new Blob(['header,header2\ncell,cell1'], { type: 'text/plain' })] } };
      component.uploadBanList(event as any);
      expect(openSpy).toHaveBeenCalledWith('Collection uploading', 'OK', { duration: 5000 });

      // TODO: figure out how to test inside papa parse
    });
  });

  describe('downloadBanList', () => {
    it('should handle invalid ban list form', () => {
      component.customBanListForm.controls['banned'].setValue('abc');
      const openSpy = spyOn(component['snackBar'], 'open').and.callThrough();
      component.downloadBanList();
      expect(openSpy).toHaveBeenCalledWith('Please double check your custom bans.', 'OK', { duration: 5000 });
    });

    it('should handle no uploaded collection', () => {
      component['cardQuantities'] = null as any;
      const openSpy = spyOn(component['snackBar'], 'open').and.callThrough();
      component.downloadBanList();
      expect(openSpy).toHaveBeenCalledWith('Please upload your collection.', 'OK', { duration: 5000 });
    });

    it('should handle a collection without keys', () => {
      component['cardQuantities'] = {};
      const openSpy = spyOn(component['snackBar'], 'open').and.callThrough();
      component.downloadBanList();
      expect(openSpy).toHaveBeenCalledWith('Please upload your collection.', 'OK', { duration: 5000 });
    });

    it('should handle invalid names', () => {
      component['cardQuantities'] = { 'abc': 1 };
      const openSpy = spyOn(component['snackBar'], 'open').and.callThrough();
      ['--myname', '!myname', '[myname', 'myname]', '--![]name'].forEach((name: string) => {
        component.banListName.setValue(name);
        component.downloadBanList();
        expect(openSpy).toHaveBeenCalledWith('Please enter a valid name.', 'OK', { duration: 5000 });
        openSpy.calls.reset();
      });
    });

    it('should handle valid names', () => {
      component['cardQuantities'] = { 'abc': 1 };
      const updateSpy = spyOn(component as any, 'updateCardQuantitiesForCustomBans').and.returnValue(null);
      const sortSpy = spyOn(component as any, 'sortCardsIntoBanListCategories').and.returnValue({ banned: [''] });
      const hideSpy = spyOn(component as any, 'hideAltFormatCards').and.returnValue(null);
      const listSpy = spyOn(component as any, 'generateEdoProList').and.returnValue('my ban list');
      const saveSpy = spyOn(fileSaver, 'saveAs').and.returnValue(null as any);
      component.downloadBanList();
      expect(updateSpy).toHaveBeenCalled();
      expect(sortSpy).toHaveBeenCalled();
      expect(hideSpy).toHaveBeenCalled();
      expect(listSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled(); // TODO: beef this up
    });
  });

  it('should generate an EDOPro ban list', () => {
    const banList: BanList = {
      banned: ['a', 'b', 'c'],
      limited: ['d', 'e', 'f'],
      semi: ['g', 'h', 'i'],
      unlimited: ['j', 'k', 'l'],
      hidden: ['m', 'n', 'o'],
    }

    const edoProList = component['generateEdoProList'](banList, 'My Ban List');

    expect(edoProList).toEqual(
      '#[My Ban List]\n' + 
      '!My Ban List\n' +
      '#Forbidden\n' + 
      'a 0 --\n' +
      'b 0 --\n' +
      'c 0 --\n' +
      '#Limited\n' +
      'd 1 --\n' +
      'e 1 --\n' +
      'f 1 --\n' +
      '#Semi-Limited\n' +
      'g 2 --\n' +
      'h 2 --\n' +
      'i 2 --\n' +
      '$whitelist\n' +
      '#Unlimited\n' +
      'j 3 --\n' +
      'k 3 --\n' +
      'l 3 --\n' +
      '#Hidden\n' +
      'm -1 --\n' +
      'n -1 --\n' +
      'o -1 --\n'
    );
  });

  describe('hideAltFormatCards', () => {
    it('should handle not hiding cards', () => {
      component.hideCards.controls['goat'].setValue(false);
      component.hideCards.controls['preErrata'].setValue(false);
      component.hideCards.controls['rush'].setValue(false);
      component.hideCards.controls['unofficial'].setValue(false);

      const banList: BanList = {
        banned: ['a', 'b', 'c'],
        limited: ['d', 'e', 'f'],
        semi: ['g', 'h', 'i'],
        unlimited: ['j', 'k', 'l'],
        hidden: ['m', 'n', 'o'],
      }
  
      component['hideAltFormatCards'](banList);
      
      expect(banList).toEqual({
        banned: ['a', 'b', 'c'],
        limited: ['d', 'e', 'f'],
        semi: ['g', 'h', 'i'],
        unlimited: ['j', 'k', 'l'],
        hidden: ['m', 'n', 'o'],
      });
    }); 

    it('should handle hiding cards', () => {
      component.hideCards.controls['goat'].setValue(true);
      component.hideCards.controls['preErrata'].setValue(true);
      component.hideCards.controls['rush'].setValue(true);
      component.hideCards.controls['unofficial'].setValue(true);

      const banList: BanList = {
        banned: ['a', 'b', 'c'],
        limited: ['d', 'e', 'f'],
        semi: ['g', 'h', 'i'],
        unlimited: ['j', 'k', 'l'],
        hidden: ['m', 'n', 'o'],
      }
  
      component['hideAltFormatCards'](banList);

      expect(banList.banned.length).toBe(3);
      expect(banList.limited.length).toBe(3);
      expect(banList.semi.length).toBe(3);
      expect(banList.unlimited.length).toBe(3);
      expect(banList.hidden.length).toBeGreaterThan(3);
      expect(banList.hidden).toContain('504700000');
      expect(banList.hidden).toContain('5043020');
      expect(banList.hidden).toContain('160001000');
      expect(banList.hidden).toContain('511003216');
    });
  });

  it('should set card quantities', () => {
    const cards: Array<Card> = [
      { cardid: 123, cardq: 1 } as any,
      { cardid: 456, cardq: 2 } as any,
      { cardid: 123, cardq: 3 } as any,
    ];
    component['setCardQuantities'](cards);
    expect(component['cardQuantities']).toEqual({ '123': 4, '456': 2 });
  });

  it('should sort cards into ban categories', () => {
    const cards: CardAmount = {
      'Dark Magician': 0,
      'Blue-Eyes White Dragon': 1,
      'Pot of Greed': 2,
      'Elemental HERO Flame Wingman': 3
    }

    const banList = component['sortCardsIntoBanListCategories'](cards);

    expect(banList).toEqual({
      banned: ['Dark Magician'],
      limited: ['Blue-Eyes White Dragon'],
      semi: ['Pot of Greed'],
      unlimited: ['Elemental HERO Flame Wingman'],
      hidden: []
    });
  });

  describe('updateCardQuantitiesForCustomBans', () => {
    it('should handle only simple updates', () => {
      component['cardQuantities'] = {
        '123': 3,
        '456': 2,
        '789': 1,
        '101': 0,
        'abc': 2,
        'zzz': 1
      };
      component.customBanListForm = new FormGroup({
        banned: new FormControl('123, abc'),
        limited: new FormControl('456, def'),
        semi: new FormControl('789, ghi'),
        unlimited: new FormControl('101, jkl'),
      });

      component.cardQuantityUp = new FormGroup({
        limited: new FormControl(true),
        semi: new FormControl(true),
        unlimited: new FormControl(true),
      });

      component['updateCardQuantitiesForCustomBans']();

      expect(component['cardQuantities']).toEqual({
        '101': 3,
        '123': 0,
        '456': 1,
        '789': 2,
        'abc': 0,
        'zzz': 1,
        'def': 1,
        'ghi': 2,
        'jkl': 3
      });
    });

    it('should handle only complex updates', () => {
      component['cardQuantities'] = {
        '123': 3,
        '456': 2,
        '789': 1,
        '101': 0,
        'abc': 2,
        'zzz': 1
      };
      component.customBanListForm = new FormGroup({
        banned: new FormControl('123, abc'),
        limited: new FormControl('456, def'),
        semi: new FormControl('789, ghi'),
        unlimited: new FormControl('101, jkl'),
      });

      component.cardQuantityUp = new FormGroup({
        limited: new FormControl(false),
        semi: new FormControl(false),
        unlimited: new FormControl(false),
      });

      component['updateCardQuantitiesForCustomBans']();

      expect(component['cardQuantities']).toEqual({
        "101": 0,
        "123": 0,
        "456": 1,
        "789": 2,
        "abc": 0,
        "zzz": 1
    });
    });
  });
});
