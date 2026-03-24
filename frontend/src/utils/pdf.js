import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export const exportElementToPdf = async (elementId, fileName) => {
  const target = document.getElementById(elementId);
  if (!target) {
    throw new Error("Элемент для экспорта не найден");
  }

  const canvas = await html2canvas(target, { scale: 2 });
  const imageData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const width = 190;
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(imageData, "PNG", 10, 10, width, height);
  pdf.save(fileName);
};
