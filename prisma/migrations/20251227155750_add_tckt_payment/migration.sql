-- AlterTable
ALTER TABLE "HopDong" ADD COLUMN     "daThanhToan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nguoiThanhToanId" TEXT;

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_nguoiThanhToanId_fkey" FOREIGN KEY ("nguoiThanhToanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
