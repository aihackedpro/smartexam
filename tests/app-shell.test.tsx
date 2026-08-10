/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../src/app/App';

describe('App Shell', () => {
  it('แสดงหน้าหลัก เมนูหลักห้ารายการ และเครดิตครบถ้วน', () => {
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'เตรียมงานสอบให้เป็นเรื่องง่าย' })).toBeVisible();

    const navigation = screen.getByRole('navigation', { name: 'เมนูหลัก' });
    const menuLabels = ['หน้าหลัก', 'สร้างข้อสอบ', 'สแกนตรวจ', 'รายงานผล', 'เพิ่มเติม'];
    for (const label of menuLabels) {
      expect(navigation.querySelector(`a[href]`)).toBeTruthy();
      expect(screen.getByRole('link', { name: label })).toBeVisible();
    }

    expect(navigation.querySelectorAll('a')).toHaveLength(5);
    expect(screen.getByRole('contentinfo')).toHaveTextContent('ออกแบบและพัฒนาโดย');
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing',
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'Version 1.0 © 2026-2027 All Rights Reserved',
    );

    const footerLines = screen.getByRole('contentinfo').querySelectorAll('p');
    expect(footerLines).toHaveLength(3);
    expect(footerLines[0]).toHaveTextContent(/^ออกแบบและพัฒนาโดย$/);
    expect(footerLines[1]).toHaveTextContent(/^ครูโต้ง \| hAcKEdpRO \| Pongwattana Suebsing$/);
    expect(footerLines[2]).toHaveTextContent(/^Version 1\.0 © 2026-2027 All Rights Reserved$/);
    expect(
      screen.getByRole('link', { name: 'ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing' }),
    ).toHaveAttribute('href', 'https://www.facebook.com/suebsing');
  });

  it('นำทางจากเมนูไปยังหน้ารายงานผลได้', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: 'รายงานผล' }));

    expect(await screen.findByRole('heading', { name: 'รายงานผล' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'รายงานผล' })).toHaveAttribute('aria-current', 'page');
  });

  it('แสดงปุ่มงานหลักสามรายการบนหน้าหลัก', () => {
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /สร้างข้อสอบใหม่/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /พิมพ์กระดาษคำตอบ/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /เริ่มสแกนตรวจ/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'ติดตั้ง SmartExam ลงเครื่อง' })).toBeVisible();
  });

  it('เปิดคำแนะนำการติดตั้งเมื่อเบราว์เซอร์ไม่มีหน้าติดตั้งอัตโนมัติ', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'ติดตั้ง SmartExam ลงเครื่อง' }));

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('heading', { name: /ติดตั้งบน/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'เข้าใจแล้ว' })).toBeVisible();
  });

  it('แสดงหน้าซื้อ Activate Key และลิงก์ Messenger อย่างเป็นทางการ', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/more']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'ซื้อระบบหรือขอ Activate Key' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('1 เดือน');
    expect(screen.getByRole('dialog')).toHaveTextContent('19 บาท');
    expect(screen.getByRole('dialog')).toHaveTextContent('99 บาท');
    expect(screen.getByRole('dialog')).toHaveTextContent('199 บาท');
    expect(screen.getByRole('link', { name: 'ติดต่อผ่าน Messenger' })).toHaveAttribute(
      'href',
      'https://m.me/suebsing',
    );
  });

  it('เข้าถึงลิงก์ข้ามเนื้อหาและงานหลักด้วยแป้นพิมพ์ตามลำดับ', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.tab();
    expect(screen.getByRole('link', { name: 'ข้ามไปยังเนื้อหา' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'ติดตั้ง SmartExam ลงเครื่อง' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: 'ดาวน์โหลดไฟล์ Android (.apk)' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /สร้างข้อสอบใหม่/ })).toHaveFocus();
  });
});
