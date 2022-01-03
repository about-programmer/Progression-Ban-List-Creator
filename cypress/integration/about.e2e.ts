describe('about page', () => {
  it('should load page', () => {
    cy.visit('/');
    cy.contains('EDOPro Ban List Creator');
  });

  it('should navigate to about page', () => {
    cy.get('.menu-button').click();
    cy.get('.about-link').click();
    cy.contains('Why does this exist?');
  });

  it('should navigate back to homepage', () => {
    cy.get('.menu-button').click();
    cy.get('.ban-list-link').click();
    cy.contains('First, upload your collection from YGOPRODeck.');
  });
});