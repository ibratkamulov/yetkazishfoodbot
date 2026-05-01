import { Markup } from 'telegraf';
import { CategoryService } from '../../category/category.service';
import { UZ } from '../i18n/uz';

export const requestPhoneKeyboard = () =>
  Markup.keyboard([
    Markup.button.contactRequest('📱 Telefon raqamni yuborish'),
  ])
    .resize()
    .oneTime();

export const requestLocationKeyboard = () =>
  Markup.keyboard([
    Markup.button.locationRequest('📍 Lokatsiyani yuborish'),
  ])
    .resize()
    .oneTime();

export async function mainMenu(categoryService: CategoryService) {
  const categories = await categoryService.findAll();
  const labels = categories.map((c) => `${c.emoji ?? ''} ${c.name}`.trim());

  const rows: string[][] = [];
  for (let i = 0; i < labels.length; i += 2) {
    rows.push(labels.slice(i, i + 2));
  }
  rows.push([UZ.BTN_CART, UZ.BTN_ORDERS]);
  rows.push([UZ.BTN_HELP]);

  return Markup.keyboard(rows).resize().persistent();
}
