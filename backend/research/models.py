
from django.db import models


# 學術論著
class Publication(models.Model):
    TYPE_CHOICES = [
        ("journal", "期刊論文"),
        ("conference", "研討會論文"),
        ("other", "其他"),
    ]

    title = models.CharField("論文標題", max_length=300)
    authors = models.CharField("作者", max_length=300)
    year = models.PositiveIntegerField("發表年份")
    publication_type = models.CharField(
        "論文類型",
        max_length=20,
        choices=TYPE_CHOICES
    )
    venue = models.CharField(
        "發表期刊或會議名稱",
        max_length=300,
        blank=True
    )
    url = models.URLField("論文連結", blank=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "學術論著"
        verbose_name_plural = "學術論著"
        ordering = ["-year", "-id"]


# 主持計畫
class Project(models.Model):
    title = models.CharField("計畫名稱", max_length=300)
    principal_investigator = models.CharField(
        "計畫主持人",
        max_length=100
    )
    start_year = models.PositiveIntegerField("開始年份")
    end_year = models.PositiveIntegerField("結束年份")
    funding_agency = models.CharField(
        "補助單位",
        max_length=200,
        blank=True
    )
    description = models.TextField("計畫說明", blank=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "主持計畫"
        verbose_name_plural = "主持計畫"
        ordering = ["-start_year", "-id"]
