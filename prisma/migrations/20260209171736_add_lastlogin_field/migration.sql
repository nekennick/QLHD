/*
  Warnings:

  - You are about to drop the column `daThanhToan` on the `HopDong` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[soHopDongKhung]` on the table `HopDong` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "HopDong" DROP COLUMN "daThanhToan",
ADD COLUMN     "daQuyetToan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "giaTriQuyetToan" DOUBLE PRECISION,
ADD COLUMN     "giaTriThanhToan" DOUBLE PRECISION,
ADD COLUMN     "isConstructionInvestment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFrameworkContract" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ngayQuyetToan" TIMESTAMP(3),
ADD COLUMN     "ngayQuyetToanHoanTat" TIMESTAMP(3),
ADD COLUMN     "nguoiGiaoThanhToanId" TEXT,
ADD COLUMN     "soHopDongKhung" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLogin" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_fcmToken_key" ON "PushSubscription"("fcmToken");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HopDong_soHopDongKhung_key" ON "HopDong"("soHopDongKhung");

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_nguoiGiaoThanhToanId_fkey" FOREIGN KEY ("nguoiGiaoThanhToanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
