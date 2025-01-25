const { By, Builder, until } = require('selenium-webdriver');
const assert = require('assert');

(async function editDocsWrongData() {
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

    await driver.findElement(By.id('Inspected_lateness_input')).sendKeys('on time');
    await driver.findElement(By.id('Student_attendance_input')).sendKeys('one hundred');
    await driver.findElement(By.id('Room_adaptation_input')).sendKeys('0');
    await driver.findElement(By.id('Content_compatibility_input')).sendKeys('ok');
    await driver.findElement(By.id('Substantive_assessment_input')).sendKeys('5');
    await driver.findElement(By.id('Final_assessment_input')).sendKeys('very good');
    await driver.findElement(By.id('Recommendation_input')).sendKeys('speak little louder');

    await driver.findElement(By.id('buttonSave')).click();
    await driver.sleep(1000);

    const popupTextElement = await driver.findElement(By.className('popup_text'));

    const popupText = await popupTextElement.getText();
    assert.equal(popupText, "Invalid input data! Inspected Lateness: Value must be a number. Student Attendance: Value must be a number. Content Compatibility: Value must be a number. Final Rating: Value must be a number.", 'Popup text does not match');
     
    await driver.findElement(By.className('ok_popup_btn')).click();
    await driver.sleep(1000);

    const studentAttendance = await driver.findElement(By.id('Student_attendance_input'));
    const inspectedLateness = await driver.findElement(By.id('Inspected_lateness_input'));
    const contentCompatibility = await driver.findElement(By.id('Content_compatibility_input'));
    const finalRating = await driver.findElement(By.id('Final_assessment_input'));
    
    const studentAttendanceAtributes = await studentAttendance.getAttribute('class');
    const inspectedLatenessAtributes = await inspectedLateness.getAttribute('class');
    const contentCompatibilityAtributes = await contentCompatibility.getAttribute('class');
    const finalRatingAtributes = await finalRating.getAttribute('class');
    
    if (studentAttendanceAtributes.includes('input_error') && inspectedLatenessAtributes.includes('input_error') && contentCompatibilityAtributes.includes('input_error') && finalRatingAtributes.includes('input_error')) {
      console.log("Element ma klasę 'input_error'.");
      assert.equal(true, true, 'All elements have input_error class');
    } else {
      assert.equal(true, false, 'Not all elements have input_error class');
    }
  } catch (e) {
    console.error("Błąd:", e);
  } finally {
    await driver.quit();
  }
  console.log("Test TC12 zakończony pomyślnie.");
})();
