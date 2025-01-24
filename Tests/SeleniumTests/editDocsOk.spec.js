const { By, Builder, until } = require('selenium-webdriver');
const assert = require('assert');

(async function editDocsOk() {
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

    await driver.findElement(By.className('save_popup_btn')).click();
    await driver.sleep(1000);
     
    await driver.findElement(By.className('ok_popup_btn')).click();
    await driver.sleep(1000);

    spanElement = await driver.findElement(By.xpath(`//span[text()='${documentName}']`));
     
    editButton = await spanElement.findElement(By.xpath("./following-sibling::button/img"));

    await editButton.click();
    await driver.sleep(2000);

    const inspectedLateness = await driver.findElement(By.id('Inspected_lateness_input')).getAttribute('value');
    const studentAttendance = await driver.findElement(By.id('Student_attendance_input')).getAttribute('value');
    const roomAdaptation = await driver.findElement(By.id('Room_adaptation_input')).getAttribute('value');
    const contentCompatibility = await driver.findElement(By.id('Content_compatibility_input')).getAttribute('value');
    const substantiveAssessment = await driver.findElement(By.id('Substantive_assessment_input')).getAttribute('value');
    const finalAssessment = await driver.findElement(By.id('Final_assessment_input')).getAttribute('value');
    const recommendation = await driver.findElement(By.id('Recommendation_input')).getAttribute('value');

    assert.equal(inspectedLateness, '5', 'Inspected lateness value does not match');
    assert.equal(studentAttendance, '150', 'Student attendance value does not match');
    assert.equal(roomAdaptation, 'Excellent', 'Room adaptation value does not match');
    assert.equal(contentCompatibility, '6', 'Content compatibility value does not match');
    assert.equal(substantiveAssessment, 'Detailed', 'Substantive assessment value does not match');
    assert.equal(finalAssessment, '4', 'Final assessment value does not match');
    assert.equal(recommendation, '0', 'Recommendation value does not match');

    console.log('All values are correct');
    driver.sleep(1500);


  } catch (e) {
    console.error("Błąd:", e);
  } finally {
    await driver.quit();
  }
})();
