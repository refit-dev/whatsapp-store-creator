describe('WhatsApp Store E2E', () => {
  it('should add products to cart and generate WhatsApp link', () => {
    // Visit demo store
    cy.visit('/demo');

    // Add both products
    cy.get('button')
      .contains('Add to Cart')
      .first()
      .click();
    cy.get('button')
      .contains('Add to Cart')
      .last()
      .click();

    // Go to checkout
    cy.visit('/demo/checkout');

    // Fill checkout form
    cy.get('input[type="text"]').type('Test User');
    cy.get('input[type="tel"]').type('1234567890');
    cy.get('textarea').first().type('Test Address');

    // Submit and check WhatsApp URL
    cy.get('button')
      .contains('Order on WhatsApp')
      .click();

    cy.url().should('include', 'wa.me/');
  });
});