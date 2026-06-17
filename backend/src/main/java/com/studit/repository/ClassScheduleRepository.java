package com.studit.repository;

import com.studit.domain.ClassSchedule;
import com.studit.domain.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long> {
    List<ClassSchedule> findByUserOrderByDayOfWeekAscStartTimeAsc(User user);

    List<ClassSchedule> findByUserAndDayOfWeek(User user, int dayOfWeek);
}
