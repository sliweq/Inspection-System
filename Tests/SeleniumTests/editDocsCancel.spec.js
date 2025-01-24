const { By, Builder, until } = require('selenium-webdriver');
const assert = require('assert');

(async function editDocsCancel() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('http://127.0.0.1:5500/View/index.html');

    
    let title = await driver.getTitle();
    console.log("Tytuł strony:", title);
    assert.equal(title, 'Home - Inspection System');
    
    let element = await driver.findElement(By.xpath("//a[text()='Edit Documents']"));

    await element.click();

    console.log("Kliknięto w element: Edit Documents");

    await driver.wait(until.urlContains("editInspectionDocs.html"), 5000);
    console.log("Przekierowano na właściwą stronę.");

    title = await driver.getTitle();
    assert.equal(title, 'Edit Documents');

    await driver.sleep(2000);

    const documentName = "2024-12-15 16:00 Artificial Intelligence mgr inż Michael Wilson";
    let spanElement = await driver.findElement(By.xpath(`//span[text()='${documentName}']`));

    
    console.log("Document exists:", documentName);
    
    let editButton = await spanElement.findElement(By.xpath("./following-sibling::button/img"));
    await editButton.click();
      

    await driver.sleep(1500);

    await driver.findElement(By.id('Inspected_lateness_input')).clear();
    await driver.findElement(By.id('Student_attendance_input')).clear();
    await driver.findElement(By.id('Room_adaptation_input')).clear();
    await driver.findElement(By.id('Content_compatibility_input')).clear();
    await driver.findElement(By.id('Substantive_assessment_input')).clear();
    await driver.findElement(By.id('Final_assessment_input')).clear();
    await driver.findElement(By.id('Recommendation_input')).clear();

    await driver.findElement(By.id('Inspected_lateness_input')).sendKeys('5');
    await driver.findElement(By.id('Student_attendance_input')).sendKeys('150');
    await driver.findElement(By.id('Room_adaptation_input')).sendKeys('Excellent');
    await driver.findElement(By.id('Content_compatibility_input')).sendKeys('6');
    await driver.findElement(By.id('Substantive_assessment_input')).sendKeys('Detailed');
    await driver.findElement(By.id('Final_assessment_input')).sendKeys('4');
    await driver.findElement(By.id('Recommendation_input')).sendKeys('0');

    await driver.findElement(By.id('buttonSave')).click();
    await driver.sleep(1000);

    await driver.findElement(By.className('cancel_popup_btn')).click();
    await driver.sleep(1000);

  } catch (e) {
    console.error("Błąd:", e);
  } finally {
    await driver.quit();
  }
})();
