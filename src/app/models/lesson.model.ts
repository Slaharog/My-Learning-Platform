export class LessonModel {
    lessonId: string = '00000000-0000-0000-0000-000000000000';
    courseId: string = '';
    title: string = '';
    videoUrl: string = '';

    constructor(init?: Partial<LessonModel>) {
        Object.assign(this, init);
    }

    public static toFormData(lesson: LessonModel): FormData {
        const formData = new FormData();
        formData.append("title", lesson.title);
        formData.append("videoUrl", lesson.videoUrl);
        formData.append("courseId", lesson.courseId);
        return formData;
    }
}