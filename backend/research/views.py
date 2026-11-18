import json

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect
from django.shortcuts import render
from .models import Publication, Project, UIEvent
from .models import Feedback
from django.db.models import Count
from django.db.models.functions import TruncDate


# 首頁
def home(request):
    return render(request, "index.html")


# 學術論著
def publication_list(request):
    publications = Publication.objects.all()

    return render(
        request,
        "publications.html",
        {"publications": publications}
    )


# 主持計畫
def project_list(request):
    projects = Project.objects.all()
    

    print("主持計畫數量：", projects.count())

    return render(
        request,
        "projects.html",
        {"projects": projects}
    )



# Week 11：接收網站操作紀錄

@require_POST
@csrf_protect
def receive_event(request):
    try:
        event = json.loads(request.body)

        if not isinstance(event, dict):
            return JsonResponse({
                "success": False,
                "message": "資料格式錯誤"
            }, status=400)

        # 檢查必要欄位
        required_fields = [
            "event_id",
            "session_id",
            "seq",
            "event_type",
            "page_id",
            "occurred_at"
        ]

        if any(event.get(field) is None for field in required_fields):
            return JsonResponse({
                "success": False,
                "message": "缺少必要欄位"
            }, status=400)

        # 將操作紀錄寫入資料庫
        record = UIEvent.objects.create(
            event_id=event["event_id"],
            session_id=event["session_id"],
            seq=event["seq"],
            event_type=event["event_type"],
            page_id=event["page_id"],
            target_id=event.get("target_id") or "",
            occurred_at=event["occurred_at"],
            ui_version=event.get("ui_version") or "",
            test_phase=event.get("test_phase") or "",
            data=event.get("data") or {}
        )

        return JsonResponse({
            "success": True,
            "message": "操作紀錄已儲存",
            "id": record.id
        })

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "JSON 格式錯誤"
        }, status=400)



# 接收按讚、倒讚與意見回饋
@require_POST
@csrf_protect
def receive_feedback(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({
            "success": False,
            "message": "JSON 格式錯誤"
        }, status=400)

    if not isinstance(data, dict):
        return JsonResponse({
            "success": False,
            "message": "資料格式錯誤"
        }, status=400)

    page_id = data.get("page_id")
    rating = data.get("rating")
    comment = data.get("comment")

    if page_id not in ("home", "publications", "projects"):
        return JsonResponse({
            "success": False,
            "message": "頁面識別碼錯誤"
        }, status=400)

    if rating not in ("like", "dislike"):
        return JsonResponse({
            "success": False,
            "message": "請選擇按讚或倒讚"
        }, status=400)

    if not isinstance(comment, str) or not comment.strip():
        return JsonResponse({
            "success": False,
            "message": "請填寫意見"
        }, status=400)

    if len(comment.strip()) > 2000:
        return JsonResponse({
            "success": False,
            "message": "意見不可超過 2000 字"
        }, status=400)

    record = Feedback.objects.create(
        page_id=page_id,
        rating=rating,
        comment=comment.strip()
    )

    return JsonResponse({
        "success": True,
        "message": "感謝你的回饋，意見已儲存！",
        "id": record.id
    })


# Dashboard：管理員資料分析頁面
from django.contrib.admin.views.decorators import staff_member_required

@staff_member_required
def dashboard(request):
    total_events = UIEvent.objects.count()

    total_sessions = (
        UIEvent.objects.values("session_id")
        .distinct()
        .count()
    )

    total_likes = Feedback.objects.filter(rating="like").count()
    total_dislikes = Feedback.objects.filter(rating="dislike").count()

    # 統計每天的使用者操作次數
    daily_events = (
        UIEvent.objects
        .annotate(day=TruncDate("occurred_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )

    chart_labels = [
        item["day"].strftime("%Y-%m-%d")
        for item in daily_events
    ]

    chart_values = [
        item["count"]
        for item in daily_events
    ]

    # 統計各種操作事件的使用次數
    event_counts = (
        UIEvent.objects
        .values("event_type")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    event_labels = [
        item["event_type"] for item in event_counts
    ]

    event_values = [
        item["count"] for item in event_counts
    ]




    # 統計各頁面的操作次數
    page_counts = (
        UIEvent.objects
        .values("page_id")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    page_names = {
        "home": "首頁",
        "publications": "學術論著",
        "projects": "主持計畫",
    }

    page_labels = [
        page_names.get(item["page_id"], item["page_id"])
        for item in page_counts
    ]

    page_values = [
        item["count"]
        for item in page_counts
    ]


    # 統計各頁面的平均可見時間（秒）
    duration_events = UIEvent.objects.filter(
        event_type="page_duration"
    ).values("page_id", "data")

    duration_totals = {}
    duration_counts = {}

    for event in duration_events:
        page_id = event["page_id"]
        data = event["data"]

        if not isinstance(data, dict):
            continue

        visible_ms = data.get("visible_ms")

        if (
            isinstance(visible_ms, (int, float))
            and not isinstance(visible_ms, bool)
            and visible_ms >= 0
        ):
            duration_totals[page_id] = (
                duration_totals.get(page_id, 0) + visible_ms
            )
            duration_counts[page_id] = (
                duration_counts.get(page_id, 0) + 1
            )

    duration_labels = []
    duration_values = []

    for page_id, total_ms in duration_totals.items():
        average_seconds = (
            total_ms / duration_counts[page_id] / 1000
        )

        duration_labels.append(
            page_names.get(page_id, page_id)
        )
        duration_values.append(
            round(average_seconds, 1)
        )


    # 統計各頁面的按讚與倒讚數量
    feedback_counts = (
        Feedback.objects
        .values("page_id", "rating")
        .annotate(count=Count("id"))
    )

    feedback_pages = ["home", "publications", "projects"]

    feedback_labels = [
        page_names[page] for page in feedback_pages
    ]

    feedback_likes = []
    feedback_dislikes = []

    for page in feedback_pages:
        likes = 0
        dislikes = 0

        for item in feedback_counts:
            if item["page_id"] == page:
                if item["rating"] == "like":
                    likes = item["count"]
                elif item["rating"] == "dislike":
                    dislikes = item["count"]

        feedback_likes.append(likes)
        feedback_dislikes.append(dislikes)


    # UI/UX 規則式自動分析
    analysis_results = []

    # 1. 操作次數最多的頁面
    if page_values:
        max_index = page_values.index(max(page_values))

        analysis_results.append({
            "title": "頁面操作分析",
            "description": (
                f"{page_labels[max_index]}的操作次數最多，"
                "建議進一步檢查該頁面的搜尋、篩選及導覽流程。"
            )
        })

    # 2. 平均可見時間最長的頁面
    if duration_values:
        max_index = duration_values.index(max(duration_values))

        analysis_results.append({
            "title": "頁面停留時間分析",
            "description": (
                f"{duration_labels[max_index]}的平均可見時間最長，"
                f"約 {duration_values[max_index]} 秒。"
                "建議搭配頁面內容及操作紀錄，"
                "確認使用者是否能順利完成任務。"
            )
        })

    # 3. 使用者回饋分析
    total_feedback = total_likes + total_dislikes

    if total_feedback > 0:
        like_rate = round(total_likes / total_feedback * 100, 1)

        analysis_results.append({
            "title": "使用者回饋分析",
            "description": (
                f"目前共收到 {total_feedback} 筆回饋，"
                f"按讚率為 {like_rate}%。"
                "建議查看倒讚的文字意見，"
                "找出可能需要改善的介面問題。"
            )
        })



    context = {
        "total_events": total_events,
        "total_sessions": total_sessions,
        "total_likes": total_likes,
        "total_dislikes": total_dislikes,
        "chart_labels": chart_labels,
        "chart_values": chart_values,
        "event_labels": event_labels,
        "event_values": event_values,
        "page_labels": page_labels,
        "page_values": page_values,
        "duration_labels": duration_labels,
        "duration_values": duration_values,
         "feedback_labels": feedback_labels,
        "feedback_likes": feedback_likes,
        "feedback_dislikes": feedback_dislikes,
        "analysis_results": analysis_results,

    }

    return render(request, "dashboard.html", context)
