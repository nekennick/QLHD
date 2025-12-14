-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER2',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HopDong" (
    "id" TEXT NOT NULL,
    "soHopDong" TEXT NOT NULL,
    "tenHopDong" TEXT,
    "giaTriHopDong" DOUBLE PRECISION,
    "ngayKy" TIMESTAMP(3),
    "ngayHieuLuc" TIMESTAMP(3),
    "hieuLucBaoDam" TIMESTAMP(3),
    "ngayGiaoHang" TIMESTAMP(3),
    "tuChinhHopDong" TEXT,
    "nguoiGiaoId" TEXT NOT NULL,
    "nguoiThucHienId" TEXT,
    "giaTriGiaoNhan" DOUBLE PRECISION,
    "giaTriNghiemThu" DOUBLE PRECISION,
    "ngayDuyetThanhToan" TIMESTAMP(3),
    "hanBaoHanh" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HopDong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "HopDong_soHopDong_key" ON "HopDong"("soHopDong");

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_nguoiGiaoId_fkey" FOREIGN KEY ("nguoiGiaoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HopDong" ADD CONSTRAINT "HopDong_nguoiThucHienId_fkey" FOREIGN KEY ("nguoiThucHienId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
