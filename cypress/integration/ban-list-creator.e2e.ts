describe('Ban List Creator', () => {
  it('should load page', () => {
    cy.visit('/');
    cy.contains('EDOPro Ban List Creator');
  });

  it('should load help for collection', () => {
    cy.get('.upload-help').click();
    cy.contains('YGOPRODeck Collection');
    cy.get('.close-dialog').click();
  });

  it('should not show bump up section', () => {
    cy.contains('should they be bumped up to that amount?').should('not.exist');
  });

  it('should show password help', () => {
    cy.get('.custom-ban-list-help').click();
    cy.contains('Card Passwords');
    cy.get('.close-dialog').click();
  });

  it('should show error messages when input is invalid', () => {
    const checkBans = (field: string) => {
      cy.get(field).type('abc');
      cy.contains('Must be numbers separated by commas.');
      cy.get(field).clear();
      cy.get(field).type('123');
      cy.contains('Must be numbers separated by commas.').should('not.exist');
      cy.get(field).type(',123');
      cy.contains('Must be numbers separated by commas.').should('not.exist');
    }
    checkBans('.banned-field');
    checkBans('.limited-field');
    checkBans('.semi-field');
    checkBans('.unlimited-field');
  });

  it('should show bump up section', () => {
    cy.contains('should they be bumped up to that amount?');
  });

  it('should show bump up help', () => {
    cy.get('.bump-up-help').click();
    cy.contains('Bumped Up');
    cy.get('.close-dialog').click();
  });

  it('should show/hide bump up fields based on custom ban fields', () => {
    const checkBumps = (field: string, bump: string) => {
      cy.get(field).clear();
      cy.get(bump).should('not.exist');
      cy.get(field).type('123,123');
      cy.get(bump).should('exist');
    }
    checkBumps('.limited-field', '.limited-bump');
    checkBumps('.semi-field', '.semi-bump');
    checkBumps('.unlimited-field', '.unlimited-bump');
  });

  it('should show alternative format help', () => {
    cy.get('.alt-format-help').click();
    cy.contains('Alternative Formats');
    cy.get('.close-dialog').click();
  });

  it('should show ban list name dialog', () => {
    cy.get('.name-help').click();
    cy.contains('Ban List Name');
    cy.get('.close-dialog').click();
  });

  it('should test valid ban list names', () => {
    const invalidCheckNames = (name: string) => {
      cy.get('.ban-list-name-field').type(name);
      cy.contains('Name cannot contain [ ] ! # . --');
      cy.get('.ban-list-name-field').clear();
    }
    invalidCheckNames('[my ban list');
    invalidCheckNames('my ban list]');
    invalidCheckNames('my ban list!');
    invalidCheckNames('my ban list#');
    invalidCheckNames('my ban list.');
    invalidCheckNames('my ban list--');
    cy.get('.ban-list-name-field').type('my ban list');
    cy.contains('Name cannot contain [ ] ! # . --').should('not.exist');
  });

  it('should show where it goes help', () => {
    cy.get('.where-to-put-list-help').click();
    cy.contains('Ban List Location');
    cy.get('.close-dialog').click();
  });
  
  it('should show an error when you download without a collection', () => {
    cy.get('.download-button').click();
    cy.contains('Please upload your collection.');
  });

  it('should upload file', () => {
    cy.fixture('./collection.csv').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent,
        fileName: 'collection.csv',
        mimeType: 'application/csv'
      }).then((e) => {
        console.log(e);
      });
    });
    cy.contains('Collection uploaded.');
  });

  it('should show an error when you try to download with a bad name', () => {
    cy.get('.ban-list-name-field').clear();
    cy.get('.ban-list-name-field').type('[bad name]');
    cy.get('.download-button').click();
    cy.contains('Please enter a valid name.');
    cy.get('.ban-list-name-field').clear();
    cy.get('.ban-list-name-field').type('my ban list');
  });

  it('should show an error when you try to download with bad custom bans', () => {
    const checkFields = (field: string) => {
      cy.get(field).clear();
      cy.get(field).type('abc');
      cy.get('.download-button').click();
      cy.contains('Please double check your custom bans.');
      cy.get(field).clear();
    } 
    checkFields('.banned-field');
    checkFields('.limited-field');
    checkFields('.semi-field');
    checkFields('.unlimited-field');
  });

  it('should download file and verify it', () => {
    cy.get('.download-button').click();
    cy.readFile('./cypress/downloads/my ban list.lflist.conf').then(fileContent => {
      const file = fileContent.split('\n');
      expect(file[0]).to.equal('#[my ban list]');
      expect(file[1]).to.equal('!my ban list');
      expect(file[2]).to.equal('#Forbidden');
      expect(file[3]).to.equal('#Limited');
      for (let i = 4; i < 168; i++) {
        expect(file[i]).to.contain('1 --');
      }
      expect(file[168]).to.equal('#Semi-Limited');
      for (let i = 169; i < 305; i++) {
        expect(file[i]).to.contain('2 --');
      }
      expect(file[305]).to.equal('$whitelist');
      expect(file[306]).to.equal('#Unlimited');
      for (let i = 307; i < 543; i++) {
        expect(file[i]).to.contain('3 --');
      }
      expect(file[543]).to.equal('#Hidden');
      for (let i = 544; i < file.length - 1; i++) {
        expect(file[i]).to.contain('-1 --');
      }
      expect(file[file.length - 1]).to.equal('');
    });
  });
});
