from django.contrib import admin
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.template import Template, RequestContext
from django.utils.html import escape
from django.utils.safestring import mark_safe

from .models import MentorProfile, Skill, Education, Career
from ..accounts.models import AdminStats

admin.site.register(Skill)
admin.site.register(Education)
admin.site.register(Career)

User = get_user_model()

@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ('get_email', 'get_full_name', 'headline', 'status', 'created_at')
    list_filter = ('status', 'accepting_mentees', 'created_at')
    search_fields = ('user__email', 'user__full_name', 'headline')

    fieldsets = (
        ('Thông tin tài khoản Người dùng', {
            'fields': ('get_user_email', 'get_user_full_name', 'get_user_phone')
        }),
        ('Học vấn và Kinh nghiệm', {
            'fields': ('get_educations_display', 'get_careers_display')
        }),
        ('Chi tiết hồ sơ Mentor', {
            'fields': (
                'headline',
                'expertise',
                'mentoring_description',
                'accepting_mentees',
                'max_mentees',
                'current_mentees'
            )
        }),
        ('Duyệt hồ Sơ', {
            'fields': ('status', 'rejection_reason'),
        }),
    )

    @admin.display(description='Học vấn')
    def get_educations_display(self, obj):
        educations = obj.user.educations.all()
        if not educations:
            return "Chưa cập nhật"

        rows = []
        for edu in educations:
            time_str = f"{edu.start_year or ''} - {'Hiện tại' if edu.is_current else (edu.end_year or '')}"
            rows.append(
                f"<tr>"
                f"<td style='padding:8px; border:1px solid #ddd;'><b>{escape(edu.institution)}</b></td>"
                f"<td style='padding:8px; border:1px solid #ddd;'>{escape(edu.degree or '-')}</td>"
                f"<td style='padding:8px; border:1px solid #ddd;'>{escape(edu.major or '-')}</td>"
                f"<td style='padding:8px; border:1px solid #ddd;'>{escape(time_str)}</td>"
                f"</tr>"
            )

        html = (
            f"<table style='width:100%; border-collapse: collapse; margin-top:5px;'>"
            f"<thead style='background:#f8f9fa;'>"
            f"<tr>"
            f"<th style='text-align:left; padding:8px; border:1px solid #ddd;'>Trường / Tổ chức</th>"
            f"<th style='text-align:left; padding:8px; border:1px solid #ddd;'>Bằng cấp</th>"
            f"<th style='text-align:left; padding:8px; border:1px solid #ddd;'>Chuyên ngành</th>"
            f"<th style='text-align:left; padding:8px; border:1px solid #ddd;'>Thời gian</th>"
            f"</tr></thead>"
            f"<tbody>{''.join(rows)}</tbody>"
            f"</table>"
        )
        return mark_safe(html)

    @admin.display(description='Kinh nghiệm')
    def get_careers_display(self, obj):
        careers = obj.user.careers.all()
        if not careers:
            return "Chưa cập nhật"

        rows = []
        for car in careers:
            rows.append(
                f"<tr>"
                f"<td style='padding:8px; border:1px solid #ddd;'><b>{escape(car.company)}</b></td>"
                f"<td style='padding:8px; border:1px solid #ddd;'>{escape(car.position)}</td>"
                f"<td style='padding:8px; border:1px solid #ddd;'>{escape(car.description or '-')}</td>"
                f"</tr>"
            )

        html = (
            f"<table style='width:100%; border-collapse: collapse; margin-top:5px;'>"
            f"<thead style='background:#f8f9fa;'>"
            f"<tr>"
            f"<th style='text-align:left; padding:8px; border:1px solid #ddd;'>Công ty</th>"
            f"<th style='text-align:left; padding:8px; border:1px solid #ddd;'>Vị trí</th>"
            f"<th style='text-align:left; padding:8px; border:1px solid #ddd;'>Mô tả</th>"
            f"</tr></thead>"
            f"<tbody>{''.join(rows)}</tbody>"
            f"</table>"
        )
        return mark_safe(html)

    @admin.display(description='Email')
    def get_user_email(self, obj):
        return obj.user.email

    @admin.display(description='Họ và tên')
    def get_user_full_name(self, obj):
        return obj.user.full_name or 'Chưa cập nhật'

    @admin.display(description='Số điện thoại')
    def get_user_phone(self, obj):
        return obj.user.phone or 'Chưa cập nhật'

    @admin.display(description='Email', ordering='user__email')
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description='Họ và tên', ordering='user__full_name')
    def get_full_name(self, obj):
        return obj.user.full_name

    def get_readonly_fields(self, request, obj=None):
        if obj:
            editable_fields = {'status', 'rejection_reason'}
            all_fields = {f.name for f in self.model._meta.fields}
            all_fields.add('expertise')

            readonly = list(all_fields - editable_fields)
            readonly.extend([
                'get_user_email', 'get_user_full_name', 'get_user_phone',
                'get_educations_display', 'get_careers_display'
            ])
            return readonly
        return super().get_readonly_fields(request, obj)

@admin.register(AdminStats)
class AdminDashboardStatsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = total_users - active_users

        approved_mentors = MentorProfile.objects.filter(status=MentorProfile.Status.APPROVED).count()
        pending_mentors = MentorProfile.objects.filter(status=MentorProfile.Status.PENDING).count()
        rejected_mentors = MentorProfile.objects.filter(status=MentorProfile.Status.REJECTED).count()

        content = f"""
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

        <div style="display: flex; gap: 30px; flex-wrap: wrap; margin-bottom: 30px;">
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccc; flex: 1; min-width: 300px; max-width: 450px;">
                <h3 style="text-align: center; color: #333; margin-top: 0;">Trạng Thái Người Dùng</h3>
                <div style="position: relative; height: 250px;">
                    <canvas id="userChart"></canvas>
                </div>
            </div>

            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccc; flex: 1; min-width: 300px; max-width: 450px;">
                <h3 style="text-align: center; color: #333; margin-top: 0;">Trạng Thái Duyệt Mentor</h3>
                <div style="position: relative; height: 250px;">
                    <canvas id="mentorChart"></canvas>
                </div>
            </div>
        </div>

        <script>
            const ctxUser = document.getElementById('userChart').getContext('2d');
            new Chart(ctxUser, {{
                type: 'doughnut',
                data: {{
                    labels: ['Đang hoạt động', 'Ngưng hoạt động'],
                    datasets: [{{
                        data: [{active_users}, {inactive_users}],
                        backgroundColor: ['#28a745', '#dc3545']
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{ legend: {{ position: 'bottom' }} }}
                }}
            }});

            const ctxMentor = document.getElementById('mentorChart').getContext('2d');
            new Chart(ctxMentor, {{
                type: 'bar',
                data: {{
                    labels: ['Đã duyệt', 'Chờ duyệt', 'Từ chối'],
                    datasets: [{{
                        label: 'Số lượng Mentor',
                        data: [{approved_mentors}, {pending_mentors}, {rejected_mentors}],
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{ legend: {{ display: false }} }},
                    scales: {{ y: {{ beginAtZero: true, ticks: {{ stepSize: 1 }} }} }}
                }}
            }});
        </script>
        """
        template_code = '{% extends "admin/base_site.html" %}\n{% block content %}\n' + content + '\n{% endblock %}'
        template = Template(template_code)
        context = {
            **self.admin_site.each_context(request),
            'title': 'Báo cáo và Thống kê',
        }
        return HttpResponse(template.render(RequestContext(request, context)))