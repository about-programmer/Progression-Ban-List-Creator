import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as fileSaver from 'file-saver';
import { Papa, ParseResult } from 'ngx-papaparse';
import { goat } from './alt-formats/goat';
import { preErrata } from './alt-formats/pre-errata';
import { rush } from './alt-formats/rush';
import { unofficial } from './alt-formats/unofficial';
import { BanCategory } from './enum/ban-category.enum';
import { BanList } from './interface/banlist.interface';
import { CardAmount } from './interface/card-amount.interface';
import { Card } from './interface/card.interface';

@Component({
  selector: 'app-ban-list-creator',
  templateUrl: './ban-list-creator.component.html',
  styleUrls: ['./ban-list-creator.component.scss']
})
export class BanListCreatorComponent {
  customBanListForm = new FormGroup({
    banned: new FormControl('', Validators.pattern(/^\d+(,\d+)*$/)),
    limited: new FormControl('', Validators.pattern(/^\d+(,\d+)*$/)),
    semi: new FormControl('', Validators.pattern(/^\d+(,\d+)*$/)),
    unlimited: new FormControl('', Validators.pattern(/^\d+(,\d+)*$/)),
  });

  cardQuantityUp = new FormGroup({
    limited: new FormControl(false, Validators.required),
    semi: new FormControl(false, Validators.required),
    unlimited: new FormControl(true, Validators.required),
  });

  hideCards = new FormGroup({
    goat: new FormControl(true),
    preErrata: new FormControl(true),
    rush: new FormControl(true),
    unofficial: new FormControl(true),
  });

  banListName = new FormControl('', Validators.pattern(/(?!.*--)^[^!\[\]\.#]+$/));

  private cardQuantities: CardAmount = {};

  constructor(private readonly papa: Papa,
              private readonly snackBar: MatSnackBar,
              readonly dialog: MatDialog) {
    document.title = 'EDOPro Banlist Creator';
  }

  uploadBanList(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) {
      this.snackBar.open('Please select a file.', 'OK', { duration: 5000 });
      return;
    }
    
    this.snackBar.open('Collection uploading', 'OK', { duration: 5000 });
    this.papa.parse(input.files[0], {
      header: true,
      dynamicTyping: true,
      complete: (cards: ParseResult) => {
        this.setCardQuantities(cards.data)
        this.snackBar.open('Collection uploaded.', 'OK', { duration: 5000 });
      }
    });
  }

  downloadBanList(): void {
    if (this.customBanListForm.invalid) {
      this.snackBar.open('Please double check your custom bans.', 'OK', { duration: 5000 });
      return;
    }

    if (!this.cardQuantities || !Object.keys(this.cardQuantities).length) {
      this.snackBar.open('Please upload your collection.', 'OK', { duration: 5000 });
      return;
    }

    const name = this.banListName.value ? this.banListName.value : new Date().toISOString();
    if (this.banListName.invalid) {
      this.snackBar.open('Please enter a valid name.', 'OK', { duration: 5000 });
      return;
    }

    this.updateCardQuantitiesForCustomBans();
    const banList = this.sortCardsIntoBanListCategories(this.cardQuantities);
    this.hideAltFormatCards(banList);
    const download = this.generateEdoProList(banList, name);
    fileSaver.saveAs(new Blob([download], { type: 'text/plain' }), `${name}.lflist.conf`);
  }

  private generateEdoProList(banList: BanList, name: string): string {
    let file = `#[${name}]\n!${name}\n#Forbidden\n`;
    banList.banned.forEach((cardId) => (file += `${cardId} 0 --\n`));

    file += '#Limited\n';
    banList.limited.forEach((cardId) => (file += `${cardId} 1 --\n`));

    file += '#Semi-Limited\n';
    banList.semi.forEach((cardId) => (file += `${cardId} 2 --\n`));

    file += '$whitelist\n#Unlimited\n';
    banList.unlimited.forEach((cardId) => (file += `${cardId} 3 --\n`));

    file += '#Hidden\n';
    banList.hidden.forEach((cardId) => (file += `${cardId} -1 --\n`));

    return file;
  }

  private hideAltFormatCards(banList: BanList): void {
    const hide = this.hideCards.value;
    if (hide.goat) {
      banList.hidden = banList.hidden.concat(goat);
    }
    if (hide.preErrata) {
      banList.hidden = banList.hidden.concat(preErrata);
    }
    if (hide.rush) {
      banList.hidden = banList.hidden.concat(rush);
    }
    if (hide.unofficial) {
      banList.hidden = banList.hidden.concat(unofficial);
    }
  }

  private setCardQuantities(cards: Array<Card>): void {
    cards.forEach((card: Card) => {
      const cardId = card.cardid;
      this.cardQuantities[cardId] = this.cardQuantities[cardId] || 0;
      this.cardQuantities[cardId] += card.cardq;
    });
  }

  private sortCardsIntoBanListCategories(cards: CardAmount): BanList {
    const banList: BanList = {
      banned: [],
      limited: [],
      semi: [],
      unlimited: [],
      hidden: [],
    };

    Object.entries(cards).forEach(([cardId, quantity]) => {
      switch (quantity) {
        case 0:
          banList.banned.push(cardId);
          break;
        case 1:
          banList.limited.push(cardId);
          break;
        case 2:
          banList.semi.push(cardId);
          break;
        default:
          banList.unlimited.push(cardId);
          break;
      }
    });

    return banList;
  }

  private updateCardQuantitiesForCustomBans(): void {
    const simpleUpdate = (cardIds: Array<string>, quantity: number) => {
      cardIds.forEach((cardId: string) => this.cardQuantities[cardId] = quantity) 
    };
    const complexUpdate = (cardIds: Array<string>, quantity: number) => {
      cardIds.forEach((cardId: string) => {
        if (Number(cardId) > this.cardQuantities[cardId]) {
          this.cardQuantities[cardId] = quantity;
        }
      })
    }

    const customList = this.customBanListForm.value;

    // no complex update needed for ban since you just need to bring it to 0
    if (customList.banned) {
      const cardIds = customList.banned.split(',');
      simpleUpdate(cardIds, BanCategory.banned);
    }

    if (customList.limited) {
      const cardIds = customList.limited.split(',');
      this.cardQuantityUp.value.limited ? simpleUpdate(cardIds, BanCategory.limited) : complexUpdate(cardIds, BanCategory.limited);
    }

    if (customList.semi) {
      const cardIds = customList.semi.split(',');
      this.cardQuantityUp.value.semi ? simpleUpdate(cardIds, BanCategory.semi) : complexUpdate(cardIds, BanCategory.semi);
    }

    // no complex update needed for unlimit since you just need to bring it to 3
    if (customList.unlimited && this.cardQuantityUp.value.unlimited) {
      const cardIds = customList.unlimited.split(',');
      simpleUpdate(cardIds, BanCategory.unlimited);
    }
  }

}
